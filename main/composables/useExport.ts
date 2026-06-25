import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export interface ExportColumn {
  key: string
  label: string
  render?: (value: any, row: any) => string
}

export function useExport() {
  function exportToExcel<T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    filename: string
  ) {
    if (!data || data.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    const sheetData = data.map(row => {
      const obj: Record<string, any> = {}
      columns.forEach(col => {
        const value = row[col.key]
        obj[col.label] = col.render ? col.render(value, row) : (value ?? '')
      })
      return obj
    })

    const ws = XLSX.utils.json_to_sheet(sheetData)

    // 设置列宽
    const colWidths = columns.map(col => {
      const maxLen = Math.max(
        col.label.length,
        ...data.map(row => {
          const val = col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')
          return val.length
        })
      )
      return { wch: Math.min(maxLen + 4, 40) }
    })
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)

    ElMessage.success('导出成功')
  }

  function exportToCSV<T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    filename: string
  ) {
    if (!data || data.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    const header = columns.map(c => c.label).join(',')
    const rows = data.map(row =>
      columns.map(col => {
        const val = col.render ? col.render(row[col.key], row) : (row[col.key] ?? '')
        const str = String(val)
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(',')
    )

    const csv = '\uFEFF' + [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)

    ElMessage.success('导出成功')
  }

  function printTable(tableId: string) {
    const el = document.getElementById(tableId)
    if (!el) {
      ElMessage.warning('未找到打印内容')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      ElMessage.warning('请允许弹出窗口以使用打印功能')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>打印</title>
        <style>
          body { font-family: 'Microsoft YaHei', sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background: #f5f7fa; font-weight: 600; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${el.outerHTML}
      </body>
      </html>
    `)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 300)
  }

  return {
    exportToExcel,
    exportToCSV,
    printTable
  }
}