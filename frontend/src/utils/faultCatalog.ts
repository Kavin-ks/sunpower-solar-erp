export interface FaultCodeDefinition {
  code: string;
  description: string;
  category?: string;
  isCoveredUnderWarranty?: boolean;
}

export const FAULT_CATALOG: Record<string, FaultCodeDefinition> = {
  'E04': {
    code: 'E04',
    description: 'Grid Phase Overvoltage',
    category: 'Inverter Grid Synchronization',
    isCoveredUnderWarranty: true
  },
  'ERR-E04': {
    code: 'ERR-E04',
    description: 'Grid Phase Overvoltage',
    category: 'Inverter Grid Synchronization',
    isCoveredUnderWarranty: true
  },
  'E01': {
    code: 'E01',
    description: 'Low PV Insulation Resistance',
    category: 'Array Grounding / DC Insulation',
    isCoveredUnderWarranty: true
  },
  'ERR-E01': {
    code: 'ERR-E01',
    description: 'Low PV Insulation Resistance',
    category: 'Array Grounding / DC Insulation',
    isCoveredUnderWarranty: true
  },
  'E02': {
    code: 'E02',
    description: 'Inverter Over-Temperature',
    category: 'Inverter Thermal Management',
    isCoveredUnderWarranty: true
  },
  'ERR-E02': {
    code: 'ERR-E02',
    description: 'Inverter Over-Temperature',
    category: 'Inverter Thermal Management',
    isCoveredUnderWarranty: true
  },
  'E08': {
    code: 'E08',
    description: 'Battery BMS Disconnected',
    category: 'Storage System Communication',
    isCoveredUnderWarranty: true
  },
  'ERR-E08': {
    code: 'ERR-E08',
    description: 'Battery BMS Disconnected',
    category: 'Storage System Communication',
    isCoveredUnderWarranty: true
  },
  'GEN01': {
    code: 'GEN01',
    description: 'Solar Generation Zero on Display',
    category: 'System Performance',
    isCoveredUnderWarranty: true
  },
  'PHYS01': {
    code: 'PHYS01',
    description: 'Panel Physical Glass Cracked / Hail Damage',
    category: 'External Physical Damage',
    isCoveredUnderWarranty: false
  }
};

/**
 * Returns a formatted string: "CODE — Description"
 * or "Unknown fault code — diagnosis required" if code is not in the catalog.
 */
export function formatFaultCode(rawCode: string | null | undefined): string {
  if (!rawCode || !rawCode.trim()) {
    return 'None Specified';
  }
  
  const trimmed = rawCode.trim();
  // If rawCode already contains " — " or " - ", extract just the code prefix
  const codePrefix = trimmed.split(/[\s—\-]+/)[0].toUpperCase();

  // Try exact lookup first, then normalized prefix
  const exact = FAULT_CATALOG[trimmed.toUpperCase()];
  if (exact) {
    return `${exact.code} — ${exact.description}`;
  }

  const byPrefix = FAULT_CATALOG[codePrefix];
  if (byPrefix) {
    return `${byPrefix.code} — ${byPrefix.description}`;
  }

  // If the rawCode already has a descriptive format like "E04 - Grid Phase Overvoltage"
  if (trimmed.includes('—') || trimmed.includes(' - ')) {
    const parts = trimmed.split(/[\s—\-]+(.+)/);
    if (parts.length >= 2 && parts[1].trim().length > 3) {
      return `${parts[0].trim()} — ${parts[1].trim()}`;
    }
  }

  return `${trimmed} — Unknown fault code — diagnosis required`;
}
