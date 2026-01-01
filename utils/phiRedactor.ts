import type { RedactionResult } from '@/types/dataset'

const PHI_PATTERNS = {
  names: /^(name|names|firstname|lastname|fullname|givenname|middlename|first_name|last_name|full_name|given_name|middle_name|patient_name|person_name|subject_name|participant_name|clinician_name|doctor_name|physician_name|provider_name|staff_name|user_name|patientname|personname|subjectname|participantname|clinicianname|doctorname|physicianname|providername|staffname|username)$/i,
  ssn: /^(ssn|social_security|social_security_number|socialsecurity|ss#|ss_number|social_security_num)$/i,
  dob: /^(dob|date_of_birth|birthdate|birth_date|birthday|bdate|dateofbirth|birth|date_birth)$/i,
  address: /^(address|street_address|mailing_address|home_address|physical_address|addr|street|streetaddress|mailingaddress|residence|residential_address)$/i,
  zip: /^(zip|zipcode|zip_code|postal_code|postcode|postalcode)$/i,
  phone: /^(phone|phone_number|telephone|tel|mobile|cell|cellphone|cell_phone|contact_number|phone_num|telephone_number)$/i,
  email: /^(email|email_address|e_mail|e-mail|mail|email_addr)$/i,
  mrn: /^(mrn|medical_record_number|medicalrecordnumber|record_number|recordnumber|record_id|recordid|patient_id|patientid|patient_num|medical_record_id)$/i,
  ip: /^(ip_address|ipaddress|ip)$/i,
  account: /^(account|account_number|accountnumber|acct|acct_number)$/i,
  license: /^(license|license_number|licensenumber|drivers_license|driverslicense|dl_number)$/i,
  vehicle: /^(vehicle|vehicle_id|vehicleid|license_plate|licenseplate|plate_number)$/i,
  device: /^(device|device_id|deviceid|serial_number|serialnumber)$/i,
  biometric: /^(fingerprint|retina|iris|voice|biometric)$/i,
  location: /^(city|county|precinct|neighborhood|locality)$/i,
  encounter: /^(encounter|encounter_id|encounterid|encounter_num|encounter_number|enrolment_id|enrolmentid|enrollment_id|enrollmentid)$/i,
  patientNumber: /^(patient_nbr|patient_number|patientnumber|patient_no|patient_ip_no|patientipno|pt_nbr)$/i,
  admission: /^(admission_type_id|admission_id|admissionid|admission_source_id|admission_source|admissionsource|discharge_disposition_id|discharge_disposition|dischargedisposition)$/i,
  timeInHospital: /^(time_in_hospital|timeinhospital|hospital_time|length_of_stay|los)$/i,
  payerCode: /^(payer_code|payercode|payer|insurance_code|insurancecode|payor_code)$/i,
}

function isPHIColumn(columnName: string): boolean {
  const normalized = columnName.trim().toLowerCase()

  for (const pattern of Object.values(PHI_PATTERNS)) {
    if (pattern.test(normalized)) {
      return true
    }
  }

  if (/_(name|names)$/i.test(normalized)) {
    return true
  }

  const standalonePHI = ['name', 'names', 'dob', 'ssn', 'address', 'phone', 'email', 'zip', 'zipcode']
  if (standalonePHI.includes(normalized)) {
    return true
  }

  return false
}

function redactValue(value: string): string {
  if (!value || value.trim() === '') {
    return value
  }
  return 'XXXX'
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

function parseCSV(csvData: string): { headers: string[], rows: string[][] } {
  const lines = csvData.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''))

  const rows: string[][] = []
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]).map(cell => cell.replace(/^"|"$/g, ''))
    rows.push(row)
  }

  return { headers, rows }
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function reconstructCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSVField).join(',')
  const dataLines = rows.map(row => row.map(escapeCSVField).join(','))
  return [headerLine, ...dataLines].join('\n')
}

export function redactPHI(csvData: string, manualColumns?: string[]): RedactionResult {
  if (!csvData || csvData.trim() === '') {
    return { redactedData: csvData, redactedColumns: [] }
  }

  try {
    const { headers, rows } = parseCSV(csvData)

    if (headers.length === 0) {
      return { redactedData: csvData, redactedColumns: [] }
    }

    const columnsToRedact = new Set<string>()

    headers.forEach(header => {
      if (isPHIColumn(header)) {
        columnsToRedact.add(header)
      }
    })

    if (manualColumns) {
      manualColumns.forEach(col => {
        const normalized = col.trim()
        if (headers.includes(normalized)) {
          columnsToRedact.add(normalized)
        }
      })
    }

    if (columnsToRedact.size === 0) {
      return { redactedData: csvData, redactedColumns: [] }
    }

    const columnIndexMap = new Map<string, number>()
    headers.forEach((header, index) => {
      columnIndexMap.set(header, index)
    })

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

    const redactedData = reconstructCSV(headers, redactedRows)
    const redactedColumns = Array.from(columnsToRedact)

    return { redactedData, redactedColumns }
  } catch (error) {
    console.error('Error redacting PHI:', error)
    return { redactedData: csvData, redactedColumns: [] }
  }
}

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

export function isColumnPHI(columnName: string): boolean {
  return isPHIColumn(columnName)
}
