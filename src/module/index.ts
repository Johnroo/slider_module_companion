import { runEntrypoint } from '../index.js'
import { CompanionModuleInstance } from '../companion-module-slider/index.js'
import type { CompanionModuleInstanceConfig } from '../companion-module-slider/config.js'
import type { CompanionStaticUpgradeScript } from '../module-api/upgrade.js'

// Register the module with Companion
runEntrypoint<CompanionModuleInstanceConfig, undefined>(
	CompanionModuleInstance,
	[] // No upgrade scripts needed yet
)

