import { InstanceBase, InstanceStatus, SomeCompanionConfigField, CompanionActionDefinitions, CompanionActionEvent, CompanionActionContext } from '../index.js'
import { UDPHelper } from '../helpers/udp.js'
import type { CompanionModuleInstanceConfig } from './config.js'

interface AxesStatus {
	pan?: number
	tilt?: number
	zoom?: number
	slide?: number
}

export class CompanionModuleInstance extends InstanceBase<CompanionModuleInstanceConfig> {
	private config!: CompanionModuleInstanceConfig
	private pollingInterval: NodeJS.Timeout | undefined
	private readonly OSC_PORT = 8000
	private udpSocket: UDPHelper | undefined
	private currentPanSpeed: number = 0.5
	private currentTiltSpeed: number = 0.5
	private currentSlideSpeed: number = 0.5
	private currentZoomSpeed: number = 0.5

	constructor(internal: unknown) {
		super(internal)

		this.config = {} as CompanionModuleInstanceConfig
	}

	async init(config: CompanionModuleInstanceConfig, isFirstInit: boolean, secrets: undefined): Promise<void> {
		this.config = config

		this.updateStatus(InstanceStatus.Connecting)
		
		// Initialize current speeds from config defaults
		this.currentPanSpeed = this.config.pan_tilt_speed ?? 0.5
		this.currentTiltSpeed = this.config.pan_tilt_speed ?? 0.5
		this.currentSlideSpeed = this.config.slide_speed ?? 0.5
		this.currentZoomSpeed = this.config.zoom_speed ?? 0.5
		
		// Initialize UDP socket for OSC
		if (this.config.target_ip) {
			try {
				this.udpSocket = new UDPHelper(this.config.target_ip, this.OSC_PORT)
				this.udpSocket.on('error', (error) => {
					this.log('error', `UDP Error: ${error.message}`)
				})
			} catch (error) {
				this.log('error', `Failed to create UDP socket: ${error}`)
			}
		}
		
		// Setup actions
		this.setActionDefinitions(this.getActions())
		
		// Setup variables
		this.setVariableDefinitions([
			{
				variableId: 'pan',
				name: 'Pan Position (-100 to 100)',
			},
			{
				variableId: 'tilt',
				name: 'Tilt Position (-100 to 100)',
			},
			{
				variableId: 'zoom',
				name: 'Zoom Position (-100 to 100)',
			},
			{
				variableId: 'slide',
				name: 'Slide Position (-100 to 100)',
			},
		])

		// Test connection before starting polling
		if (this.config.target_ip) {
			const isConnected = await this.testConnection()
			if (isConnected) {
				this.updateStatus(InstanceStatus.Ok, 'Connected')
				this.startPolling()
			} else {
				this.updateStatus(InstanceStatus.ConnectionFailure, 'Device not found at this IP')
			}
		} else {
			this.updateStatus(InstanceStatus.BadConfig, 'Target IP not configured')
		}
	}

	async destroy(): Promise<void> {
		this.stopPolling()
		if (this.udpSocket) {
			this.udpSocket.destroy()
			this.udpSocket = undefined
		}
	}

	async configUpdated(config: CompanionModuleInstanceConfig, secrets: undefined): Promise<void> {
		this.config = config
		this.stopPolling()
		
		// Update current speeds if config changed
		if (config.pan_tilt_speed !== undefined) {
			this.currentPanSpeed = config.pan_tilt_speed
			this.currentTiltSpeed = config.pan_tilt_speed
		}
		if (config.slide_speed !== undefined) {
			this.currentSlideSpeed = config.slide_speed
		}
		if (config.zoom_speed !== undefined) {
			this.currentZoomSpeed = config.zoom_speed
		}
		
		// Destroy old UDP socket if exists
		if (this.udpSocket) {
			this.udpSocket.destroy()
			this.udpSocket = undefined
		}
		
		// Create new UDP socket with updated config
		if (this.config.target_ip) {
			try {
				this.udpSocket = new UDPHelper(this.config.target_ip, this.OSC_PORT)
				this.udpSocket.on('error', (error) => {
					this.log('error', `UDP Error: ${error.message}`)
				})
			} catch (error) {
				this.log('error', `Failed to create UDP socket: ${error}`)
			}
		}
		
		// Test connection and update status
		if (this.config.target_ip) {
			const isConnected = await this.testConnection()
			if (isConnected) {
				this.updateStatus(InstanceStatus.Ok, 'Connected')
				this.startPolling()
			} else {
				this.updateStatus(InstanceStatus.ConnectionFailure, 'Device not found at this IP')
			}
		} else {
			this.updateStatus(InstanceStatus.BadConfig, 'Target IP not configured')
		}
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return [
			{
				type: 'textinput',
				id: 'target_ip',
				label: 'Target IP Address',
				width: 8,
				required: true,
				regex: '/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/',
			},
			{
				type: 'static-text',
				id: 'speed_info',
				label: 'Speed Configuration',
				width: 12,
				value: 'Configure the default speed for each axis type. You can still adjust speed per action.',
			},
			{
				type: 'dropdown',
				id: 'pan_tilt_speed',
				label: 'Pan/Tilt Speed',
				width: 6,
				default: 0.5,
				choices: [
					{ id: 0.1, label: 'Slow (0.1)' },
					{ id: 0.5, label: 'Medium (0.5)' },
					{ id: 1.0, label: 'Fast (1.0)' },
				],
			},
			{
				type: 'dropdown',
				id: 'slide_speed',
				label: 'Slide Speed',
				width: 6,
				default: 0.5,
				choices: [
					{ id: 0.1, label: 'Slow (0.1)' },
					{ id: 0.5, label: 'Medium (0.5)' },
					{ id: 1.0, label: 'Fast (1.0)' },
				],
			},
			{
				type: 'dropdown',
				id: 'zoom_speed',
				label: 'Zoom Speed',
				width: 6,
				default: 0.5,
				choices: [
					{ id: 0.1, label: 'Slow (0.1)' },
					{ id: 0.5, label: 'Medium (0.5)' },
					{ id: 1.0, label: 'Fast (1.0)' },
				],
			},
		]
	}

	private getActions(): CompanionActionDefinitions {
		return {
			pan_left: {
				name: 'Pan Left',
				options: [
					{
						type: 'dropdown',
						id: 'speed',
						label: 'Speed (0 = use config)',
						default: 0,
						choices: [
							{ id: 0, label: 'Config Default' },
							{ id: 0.1, label: 'Slow (0.1)' },
							{ id: 0.5, label: 'Medium (0.5)' },
							{ id: 1.0, label: 'Fast (1.0)' },
						],
					},
				],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					const actionSpeed = parseFloat(String(event.options.speed ?? 0))
					const speed = actionSpeed !== 0 ? actionSpeed : this.currentPanSpeed
					this.sendOsc('/pan', -speed)
				},
			},

			pan_right: {
				name: 'Pan Right',
				options: [
					{
						type: 'dropdown',
						id: 'speed',
						label: 'Speed (0 = use config)',
						default: 0,
						choices: [
							{ id: 0, label: 'Config Default' },
							{ id: 0.1, label: 'Slow (0.1)' },
							{ id: 0.5, label: 'Medium (0.5)' },
							{ id: 1.0, label: 'Fast (1.0)' },
						],
					},
				],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					const actionSpeed = parseFloat(String(event.options.speed ?? 0))
					const speed = actionSpeed !== 0 ? actionSpeed : this.currentPanSpeed
					this.sendOsc('/pan', speed)
				},
			},

			tilt_up: {
				name: 'Tilt Up',
				options: [
					{
						type: 'dropdown',
						id: 'speed',
						label: 'Speed (0 = use config)',
						default: 0,
						choices: [
							{ id: 0, label: 'Config Default' },
							{ id: 0.1, label: 'Slow (0.1)' },
							{ id: 0.5, label: 'Medium (0.5)' },
							{ id: 1.0, label: 'Fast (1.0)' },
						],
					},
				],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					const actionSpeed = parseFloat(String(event.options.speed ?? 0))
					const speed = actionSpeed !== 0 ? actionSpeed : this.currentTiltSpeed
					this.sendOsc('/tilt', speed)
				},
			},

			tilt_down: {
				name: 'Tilt Down',
				options: [
					{
						type: 'dropdown',
						id: 'speed',
						label: 'Speed (0 = use config)',
						default: 0,
						choices: [
							{ id: 0, label: 'Config Default' },
							{ id: 0.1, label: 'Slow (0.1)' },
							{ id: 0.5, label: 'Medium (0.5)' },
							{ id: 1.0, label: 'Fast (1.0)' },
						],
					},
				],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					const actionSpeed = parseFloat(String(event.options.speed ?? 0))
					const speed = actionSpeed !== 0 ? actionSpeed : this.currentTiltSpeed
					this.sendOsc('/tilt', -speed)
				},
			},

			slide_left: {
				name: 'Slide Left',
				options: [
					{
						type: 'dropdown',
						id: 'speed',
						label: 'Speed (0 = use config)',
						default: 0,
						choices: [
							{ id: 0, label: 'Config Default' },
							{ id: 0.1, label: 'Slow (0.1)' },
							{ id: 0.5, label: 'Medium (0.5)' },
							{ id: 1.0, label: 'Fast (1.0)' },
						],
					},
				],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					const actionSpeed = parseFloat(String(event.options.speed ?? 0))
					const speed = actionSpeed !== 0 ? actionSpeed : this.currentSlideSpeed
					this.sendOsc('/slide', -speed)
				},
			},

			slide_right: {
				name: 'Slide Right',
				options: [
					{
						type: 'dropdown',
						id: 'speed',
						label: 'Speed (0 = use config)',
						default: 0,
						choices: [
							{ id: 0, label: 'Config Default' },
							{ id: 0.1, label: 'Slow (0.1)' },
							{ id: 0.5, label: 'Medium (0.5)' },
							{ id: 1.0, label: 'Fast (1.0)' },
						],
					},
				],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					const actionSpeed = parseFloat(String(event.options.speed ?? 0))
					const speed = actionSpeed !== 0 ? actionSpeed : this.currentSlideSpeed
					this.sendOsc('/slide', speed)
				},
			},

			zoom_in: {
				name: 'Zoom In',
				options: [
					{
						type: 'dropdown',
						id: 'speed',
						label: 'Speed (0 = use config)',
						default: 0,
						choices: [
							{ id: 0, label: 'Config Default' },
							{ id: 0.1, label: 'Slow (0.1)' },
							{ id: 0.5, label: 'Medium (0.5)' },
							{ id: 1.0, label: 'Fast (1.0)' },
						],
					},
				],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					const actionSpeed = parseFloat(String(event.options.speed ?? 0))
					const speed = actionSpeed !== 0 ? actionSpeed : this.currentZoomSpeed
					this.sendOsc('/zoom', speed)
				},
			},

			zoom_out: {
				name: 'Zoom Out',
				options: [
					{
						type: 'dropdown',
						id: 'speed',
						label: 'Speed (0 = use config)',
						default: 0,
						choices: [
							{ id: 0, label: 'Config Default' },
							{ id: 0.1, label: 'Slow (0.1)' },
							{ id: 0.5, label: 'Medium (0.5)' },
							{ id: 1.0, label: 'Fast (1.0)' },
						],
					},
				],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					const actionSpeed = parseFloat(String(event.options.speed ?? 0))
					const speed = actionSpeed !== 0 ? actionSpeed : this.currentZoomSpeed
					this.sendOsc('/zoom', -speed)
				},
			},

			// Speed control actions
			set_pan_tilt_speed: {
				name: 'Set Pan/Tilt Speed',
				options: [
					{
						type: 'dropdown',
						id: 'speed',
						label: 'Speed',
						default: 0.5,
						choices: [
							{ id: 0.1, label: 'Slow (0.1)' },
							{ id: 0.5, label: 'Medium (0.5)' },
							{ id: 1.0, label: 'Fast (1.0)' },
						],
					},
				],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					const speed = parseFloat(String(event.options.speed ?? 0.5))
					this.currentPanSpeed = speed
					this.currentTiltSpeed = speed
					this.log('debug', `Pan/Tilt speed set to: ${speed}`)
				},
			},

			set_slide_speed: {
				name: 'Set Slide Speed',
				options: [
					{
						type: 'dropdown',
						id: 'speed',
						label: 'Speed',
						default: 0.5,
						choices: [
							{ id: 0.1, label: 'Slow (0.1)' },
							{ id: 0.5, label: 'Medium (0.5)' },
							{ id: 1.0, label: 'Fast (1.0)' },
						],
					},
				],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					const speed = parseFloat(String(event.options.speed ?? 0.5))
					this.currentSlideSpeed = speed
					this.log('debug', `Slide speed set to: ${speed}`)
				},
			},

			set_zoom_speed: {
				name: 'Set Zoom Speed',
				options: [
					{
						type: 'dropdown',
						id: 'speed',
						label: 'Speed',
						default: 0.5,
						choices: [
							{ id: 0.1, label: 'Slow (0.1)' },
							{ id: 0.5, label: 'Medium (0.5)' },
							{ id: 1.0, label: 'Fast (1.0)' },
						],
					},
				],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					const speed = parseFloat(String(event.options.speed ?? 0.5))
					this.currentZoomSpeed = speed
					this.log('debug', `Zoom speed set to: ${speed}`)
				},
			},

			// Stop actions - send 0 to stop all movement
			stop_pan: {
				name: 'Stop Pan',
				options: [],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					this.sendOsc('/pan', 0)
				},
			},

			stop_tilt: {
				name: 'Stop Tilt',
				options: [],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					this.sendOsc('/tilt', 0)
				},
			},

			stop_slide: {
				name: 'Stop Slide',
				options: [],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					this.sendOsc('/slide', 0)
				},
			},

			stop_zoom: {
				name: 'Stop Zoom',
				options: [],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					this.sendOsc('/zoom', 0)
				},
			},

			stop_all: {
				name: 'Stop All',
				options: [],
				callback: async (event: CompanionActionEvent, context: CompanionActionContext) => {
					this.sendOsc('/pan', 0)
					this.sendOsc('/tilt', 0)
					this.sendOsc('/slide', 0)
					this.sendOsc('/zoom', 0)
				},
			},
		}
	}

	private sendOsc(path: string, args: number | number[]): void {
		if (!this.config.target_ip) {
			this.log('warn', 'Cannot send OSC: target IP not configured')
			return
		}

		// Always pass as a single number, never as an array
		// Even if the type allows arrays, Companion's OSC sender may have issues
		const value = Array.isArray(args) ? args[0] : args
		this.log('info', `Sending OSC to ${this.config.target_ip}:${this.OSC_PORT} ${path} ${value}`)
		
		// Use UDPHelper if available, otherwise fall back to oscSend
		if (this.udpSocket) {
			this.sendOscUDP(path, value).catch((err) => {
				this.log('error', `UDP OSC send failed: ${err}`)
			})
		} else {
			// Fall back to Companion's oscSend
			try {
				this.oscSend(this.config.target_ip, this.OSC_PORT, path, value)
			} catch (error) {
				this.log('warn', `oscSend failed: ${error}. The OSC message was: ${path} ${value}`)
			}
		}
	}

	/**
	 * Send OSC message using UDP socket with raw OSC encoding
	 */
	private async sendOscUDP(path: string, value: number): Promise<void> {
		if (!this.udpSocket) {
			throw new Error('UDP socket not initialized')
		}

		// Encode OSC message
		// OSC format: path (null-padded to 4-byte boundary) + type tags + values (4-byte aligned)
		const buffer = Buffer.allocUnsafe(1024)
		let offset = 0

		// Write path
		offset += buffer.write(path, offset, 'ascii')
		buffer[offset++] = 0 // null terminator
		// Pad to 4-byte boundary
		while (offset % 4 !== 0) {
			buffer[offset++] = 0
		}

		// Write type tag string: ",f" for float
		offset += buffer.write(',f', offset, 'ascii')
		buffer[offset++] = 0 // null terminator
		// Pad to 4-byte boundary
		while (offset % 4 !== 0) {
			buffer[offset++] = 0
		}

		// Write float value (32-bit big-endian)
		buffer.writeFloatBE(value, offset)
		offset += 4

		// Send only the actual data
		await this.udpSocket.send(buffer.slice(0, offset))
	}

	private async testConnection(): Promise<boolean> {
		if (!this.config.target_ip) {
			return false
		}

		const url = `http://${this.config.target_ip}/api/axes/status`
		
		try {
			// Create a timeout promise
			const timeoutPromise = new Promise<never>((_, reject) => {
				setTimeout(() => reject(new Error('Connection timeout')), 3000)
			})

			const response = await Promise.race([
				fetch(url, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				}),
				timeoutPromise,
			])

			return response.ok
		} catch (error) {
			this.log('debug', `Connection test failed: ${(error as Error).message}`)
			return false
		}
	}

	private startPolling(): void {
		this.stopPolling()

		if (!this.config.target_ip) {
			return
		}

		// Poll every 200ms
		this.pollingInterval = setInterval(() => {
			this.pollStatus().catch((err) => {
				this.log('error', `Polling error: ${err.message}`)
			})
		}, 200)
	}

	private stopPolling(): void {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval)
			this.pollingInterval = undefined
		}
	}

	private async pollStatus(): Promise<void> {
		if (!this.config.target_ip) {
			return
		}

		const url = `http://${this.config.target_ip}/api/axes/status`

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			})

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`)
			}

		const data = await response.json() as AxesStatus
		
		// Convert 0-1 values to -100 to 100 scale where:
		// 0.0 maps to -100, 0.5 maps to 0, 1.0 maps to 100
		// Formula: (value - 0.5) * 200
		const pan = Math.round(((data.pan ?? 0.5) - 0.5) * 200)
		const tilt = Math.round(((data.tilt ?? 0.5) - 0.5) * 200)
		const zoom = Math.round(((data.zoom ?? 0.5) - 0.5) * 200)
		const slide = Math.round(((data.slide ?? 0.5) - 0.5) * 200)

			// Update variables
			this.setVariableValues({
				pan: pan,
				tilt: tilt,
				zoom: zoom,
				slide: slide,
			})
		} catch (error) {
			const err = error as Error
			this.log('debug', `Poll error: ${err.message}`)
		}
	}
}

