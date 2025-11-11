/**
 * PHI (Protected Health Information) Redaction Utility
 * 
 * Automatically detects and redacts PHI from CSV data for HIPAA/NIST compliance.
 * All processing happens client-side - original data is never sent to servers.
 */

interface RedactionResult {
  redactedData: string
  redactedColumns: string[]
}

/**
 * Patterns for detecting PHI columns by name
 * Case-insensitive matching
 */
const PHI_PATTERNS = {
  // Names
  names: /^(first|last|full|given|middle|patient|person|subject|participant|patient_|person_|subject_|participant_)?(name|names|firstname|lastname|fullname|givenname|middlename)$/i,
  
  // Social Security Number
  ssn: /^(ssn|social_security|social_security_number|socialsecurity|ss#|ss_number)$/i,
  
  // Date of Birth
  dob: /^(dob|date_of_birth|birthdate|birth_date|birthday|bdate|dateofbirth)$/i,
  
  // Address
  address: /^(address|street_address|mailing_address|home_address|physical_address|addr|street|streetaddress|mailingaddress)$/i,
  
  // Zip Code
  zip: /^(zip|zipcode|zip_code|postal_code|postcode|postalcode)$/i,
  
  // Phone
  phone: /^(phone|phone_number|telephone|tel|mobile|cell|cellphone|cell_phone|contact_number)$/i,
  
  // Email
  email: /^(email|email_address|e_mail|e-mail|mail)$/i,
  
  // Medical Record Number
  mrn: /^(mrn|medical_record_number|medicalrecordnumber|record_number|recordnumber|patient_id|patientid)$/i,
  
  // IP Address
  ip: /^(ip_address|ipaddress|ip)$/i,
  
  // Account Numbers
  account: /^(account|account_number|accountnumber|acct|acct_number)$/i,
  
  // License Numbers
  license: /^(license|license_number|licensenumber|drivers_license|driverslicense|dl_number)$/i,
  
  // Vehicle Identifiers
  vehicle: /^(vehicle|vehicle_id|vehicleid|license_plate|licenseplate|plate_number)$/i,
  
  // Device Identifiers
  device: /^(device|device_id|deviceid|serial_number|serialnumber)$/i,
  
  // Biometric Identifiers
  biometric: /^(fingerprint|retina|iris|voice|biometric)$/i,
  
  // Geographic subdivisions smaller than state
  location: /^(city|county|precinct|neighborhood|locality)$/i,
}

/**
 * Checks if a column name matches any PHI pattern
 */
function isPHIColumn(columnName: string): boolean {
  const normalized = columnName.trim()
  
  for (const pattern of Object.values(PHI_PATTERNS)) {
    if (pattern.test(normalized)) {
      return true
    }
  }
  
  return false
}

/**
 * Redacts a single cell value, replacing it with "XXXX"
 */
function redactValue(value: string): string {
  if (!value || value.trim() === '') {
    return value
  }
  return 'XXXX'
}

/**
 * Parses CSV data into headers and rows
 */
function parseCSV(csvData: string): { headers: string[], rows: string[][] } {
  const lines = csvData.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }
  
  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  
  // Parse data rows
  const rows: string[][] = []
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
    rows.push(row)
  }
  
  return { headers, rows }
}

/**
 * Reconstructs CSV from headers and rows
 */
function reconstructCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(',')
  const dataLines = rows.map(row => row.join(','))
  return [headerLine, ...dataLines].join('\n')
}

/**
 * Redacts PHI from CSV data
 * 
 * @param csvData Original CSV data string
 * @param manualColumns Optional array of column names to manually redact (in addition to auto-detected ones)
 * @returns Object containing redacted CSV data and list of redacted column names
 */
export function redactPHI(csvData: string, manualColumns?: string[]): RedactionResult {
  if (!csvData || csvData.trim() === '') {
    return { redactedData: csvData, redactedColumns: [] }
  }

  try {
    const { headers, rows } = parseCSV(csvData)
    
    if (headers.length === 0) {
      return { redactedData: csvData, redactedColumns: [] }
    }

    // Identify columns to redact
    const columnsToRedact = new Set<string>()
    
    // Auto-detect PHI columns
    headers.forEach(header => {
      if (isPHIColumn(header)) {
        columnsToRedact.add(header)
      }
    })
    
    // Add manually specified columns
    if (manualColumns) {
      manualColumns.forEach(col => {
        const normalized = col.trim()
        if (headers.includes(normalized)) {
          columnsToRedact.add(normalized)
        }
      })
    }

    // If no columns to redact, return original
    if (columnsToRedact.size === 0) {
      return { redactedData: csvData, redactedColumns: [] }
    }

    // Create column index map
    const columnIndexMap = new Map<string, number>()
    headers.forEach((header, index) => {
      columnIndexMap.set(header, index)
    })

    // Redact data
    const redactedRows = rows.map(row => {
      const redactedRow = [...row]
      columnsToRedact.forEach(columnName => {
        const index = columnIndexMap.get(columnName)
        if (index !== undefined && index < redactedRow.length) {
          redactedRow[index] = redactValue(redactedRow[index])
        }
      })
      return redactedRow
    })

    // Reconstruct CSV
    const redactedData = reconstructCSV(headers, redactedRows)
    const redactedColumns = Array.from(columnsToRedact)

    return { redactedData, redactedColumns }
  } catch (error) {
    console.error('Error redacting PHI:', error)
    // Return original data if redaction fails
    return { redactedData: csvData, redactedColumns: [] }
  }
}

/**
 * Gets all column names from CSV data
 */
export function getCSVColumns(csvData: string): string[] {
  if (!csvData || csvData.trim() === '') {
    return []
  }

  try {
    const lines = csvData.split('\n').filter(line => line.trim())
    if (lines.length === 0) {
      return []
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    return headers
  } catch (error) {
    console.error('Error parsing CSV columns:', error)
    return []
  }
}

/**
 * Checks if a specific column is detected as PHI
 */
export function isColumnPHI(columnName: string): boolean {
  return isPHIColumn(columnName)
}

