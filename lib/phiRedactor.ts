/**
 * PHI (Protected Health Information) Redaction Utility
 * 
 * Automatically detects and redacts PHI from CSV data for NIST compliance.
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
  // Names - matches name, names, firstname, lastname, fullname, patient_name, clinician_name, doctor_name, etc.
  // Pattern: matches "name" standalone, or any prefix ending with underscore + "name", or common name variations
  names: /^(name|names|firstname|lastname|fullname|givenname|middlename|first_name|last_name|full_name|given_name|middle_name|patient_name|person_name|subject_name|participant_name|clinician_name|doctor_name|physician_name|provider_name|staff_name|user_name|patientname|personname|subjectname|participantname|clinicianname|doctorname|physicianname|providername|staffname|username)$/i,
  
  // Social Security Number
  ssn: /^(ssn|social_security|social_security_number|socialsecurity|ss#|ss_number|social_security_num)$/i,
  
  // Date of Birth
  dob: /^(dob|date_of_birth|birthdate|birth_date|birthday|bdate|dateofbirth|birth|date_birth)$/i,
  
  // Address
  address: /^(address|street_address|mailing_address|home_address|physical_address|addr|street|streetaddress|mailingaddress|residence|residential_address)$/i,
  
  // Zip Code
  zip: /^(zip|zipcode|zip_code|postal_code|postcode|postalcode)$/i,
  
  // Phone
  phone: /^(phone|phone_number|telephone|tel|mobile|cell|cellphone|cell_phone|contact_number|phone_num|telephone_number)$/i,
  
  // Email
  email: /^(email|email_address|e_mail|e-mail|mail|email_addr)$/i,
  
  // Medical Record Number / Patient ID
  mrn: /^(mrn|medical_record_number|medicalrecordnumber|record_number|recordnumber|record_id|recordid|patient_id|patientid|patient_num|medical_record_id)$/i,
  
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
  
  // Healthcare encounter and admission identifiers
  encounter: /^(encounter|encounter_id|encounterid|encounter_num|encounter_number|enrolment_id|enrolmentid|enrollment_id|enrollmentid)$/i,
  
  // Patient number/identifier
  patientNumber: /^(patient_nbr|patient_number|patientnumber|patient_no|patient_ip_no|patientipno|pt_nbr)$/i,
  
  // Admission-related identifiers
  admission: /^(admission_type_id|admission_id|admissionid|admission_source_id|admission_source|admissionsource|discharge_disposition_id|discharge_disposition|dischargedisposition)$/i,
  
  // Time in hospital (potentially identifiable when combined with other data)
  timeInHospital: /^(time_in_hospital|timeinhospital|hospital_time|length_of_stay|los)$/i,
  
  // Payer/insurance codes (can be identifying)
  payerCode: /^(payer_code|payercode|payer|insurance_code|insurancecode|payor_code)$/i,
}

/**
 * Checks if a column name matches any PHI pattern
 */
function isPHIColumn(columnName: string): boolean {
  const normalized = columnName.trim().toLowerCase()
  
  // Check explicit patterns
  for (const pattern of Object.values(PHI_PATTERNS)) {
    if (pattern.test(normalized)) {
      return true
    }
  }
  
  // Additional flexible checks for common PHI patterns
  // Any column ending with "_name" or "_names" (e.g., clinician_name, doctor_name)
  if (/_(name|names)$/i.test(normalized)) {
    return true
  }
  
  // Exact match for common standalone PHI fields
  const standalonePHI = ['name', 'names', 'dob', 'ssn', 'address', 'phone', 'email', 'zip', 'zipcode']
  if (standalonePHI.includes(normalized)) {
    return true
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
 * Properly parses CSV line handling quoted fields with commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current.trim())
  
  return result
}

/**
 * Parses CSV data into headers and rows
 */
function parseCSV(csvData: string): { headers: string[], rows: string[][] } {
  const lines = csvData.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }
  
  // Parse headers using proper CSV parsing
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''))
  
  // Parse data rows
  const rows: string[][] = []
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]).map(cell => cell.replace(/^"|"$/g, ''))
    rows.push(row)
  }
  
  return { headers, rows }
}

/**
 * Escapes CSV field if it contains comma, quote, or newline
 */
function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/**
 * Reconstructs CSV from headers and rows
 */
function reconstructCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSVField).join(',')
  const dataLines = rows.map(row => row.map(escapeCSVField).join(','))
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
    
    const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''))
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

