import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { format, columns, data } = body

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { success: false, message: 'Data tidak valid' },
        { status: 400 }
      )
    }

    // Filter data sesuai kolom yang dipilih
    const filteredData = data.map((row: any) => {
      const filteredRow: any = {}
      columns.forEach((col: string) => {
        filteredRow[col] = row[col]
      })
      return filteredRow
    })

    if (format === 'excel') {
      // Generate Excel
      const worksheet = XLSX.utils.json_to_sheet(filteredData)
      
      // Auto-width columns
      const colWidths = columns.map((col: string) => ({
        wch: Math.max(col.length, 15)
      }))
      worksheet['!cols'] = colWidths

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan APD')
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="Laporan_APD_${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      })
    } else if (format === 'pdf') {
      // Untuk PDF, kita bisa gunakan library seperti pdfkit atau puppeteer
      // Untuk sementara, kita return Excel saja atau implementasi PDF sederhana
      return NextResponse.json(
        { success: false, message: 'Format PDF belum tersedia, gunakan Excel' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Format tidak valid' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal generate laporan' },
      { status: 500 }
    )
  }
}