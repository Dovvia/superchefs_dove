import { RefObject, useRef } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from "@mui/material";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useReactToPrint } from "react-to-print";
import { ContentNode } from "react-to-print/lib/types/ContentNode";

// This component renders the report view and provides download options
const useAccountReportGenerator = ({ accountData }) => {
  const printRef = useRef<HTMLButtonElement>(null);

  // Sample data if no data is provided (matches the screenshot)
  const sampleData = {
    dateRange: "All time",
    filters: {
      branches: "All Branches",
      products: "All Products",
    },
    financialSummary: {
      totalRevenue: 77.5,
      itemsSold: 5,
      totalCost: 46.5,
      netProfit: 31.0,
      costRevenueRatio: 60.0,
    },
    salesDetails: [
      {
        date: "Mar 10, 2025",
        branch: "Ojodu (Justrite)",
        items: "2x Chocolate Cake, 3x Chocolate Chip Cookies",
        amount: 77.5,
      },
    ],
    revenueVsCost: {
      labels: ["3/10/2025"],
      revenue: [77.5],
      cost: [46.5],
    },
  };

  // Use provided data or sample data
  const data = accountData || sampleData;

  // Function to generate and download PDF report
  const generatePDF = () => {
    const doc = new jsPDF();

    // Add report title
    doc.setFontSize(18);
    doc.text("Accounts Report", 14, 22);

    // Add date and filters
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Date Range: ${data.dateRange}`, 14, 36);
    doc.text(
      `Filters: ${data.filters.branches}, ${data.filters.products}`,
      14,
      42
    );

    // Add Financial Summary Table
    doc.setFontSize(14);
    doc.text("Financial Summary", 14, 55);

    const summaryData = [
      [
        "Total Revenue",
        `$${data.financialSummary.totalRevenue.toFixed(2)}`,
        `From ${data.financialSummary.itemsSold} items sold`,
      ],
      [
        "Total Cost",
        `$${data.financialSummary.totalCost.toFixed(2)}`,
        "Operating expenses",
      ],
      [
        "Net Profit",
        `$${data.financialSummary.netProfit.toFixed(2)}`,
        "Revenue - Cost",
      ],
      [
        "Cost/Revenue Ratio",
        `${data.financialSummary.costRevenueRatio.toFixed(1)}%`,
        "Cost as % of revenue",
      ],
    ];

    autoTable(doc, {
      startY: 60,
      head: [["Metric", "Value", "Details"]],
      body: summaryData,
      theme: "striped",
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Add Revenue vs Cost section
    doc.setFontSize(14);
    let currentY = doc.lastAutoTable.finalY + 15;
    doc.text("Revenue vs Cost", 14, currentY);

    // Draw a simple bar representation (actual chart would require more complex canvas operations)
    currentY += 10;

    // Label for date
    doc.setFontSize(10);
    doc.text(data.revenueVsCost.labels[0], 50, currentY + 65);

    // Revenue bar
    doc.setFillColor(76, 175, 80); // Green
    doc.rect(40, currentY, 30, data.revenueVsCost.revenue[0], "F");
    doc.text("Revenue", 40, currentY - 5);

    // Cost bar
    doc.setFillColor(244, 67, 54); // Red
    doc.rect(80, currentY, 30, data.revenueVsCost.cost[0], "F");
    doc.text("Cost", 80, currentY - 5);

    // Add Sales Details Table
    currentY += 80;
    doc.setFontSize(14);
    doc.text("Sales Details", 14, currentY);

    const salesData = data.salesDetails.map((sale) => [
      sale.date,
      sale.branch,
      sale.items,
      `$${sale.amount.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["Date", "Branch", "Items", "Amount"]],
      body: salesData,
      theme: "striped",
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Save the PDF
    doc.save("accounts_report.pdf");
  };

  // Function to generate and download Excel report
  const generateExcel = () => {
    // Create workbook and worksheets
    const wb = XLSX.utils.book_new();

    // Financial Summary Sheet
    const summaryData = [
      ["Accounts Report"],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [`Date Range: ${data.dateRange}`],
      [`Filters: ${data.filters.branches}, ${data.filters.products}`],
      [],
      ["Metric", "Value", "Details"],
      [
        "Total Revenue",
        `$${data.financialSummary.totalRevenue.toFixed(2)}`,
        `From ${data.financialSummary.itemsSold} items sold`,
      ],
      [
        "Total Cost",
        `$${data.financialSummary.totalCost.toFixed(2)}`,
        "Operating expenses",
      ],
      [
        "Net Profit",
        `$${data.financialSummary.netProfit.toFixed(2)}`,
        "Revenue - Cost",
      ],
      [
        "Cost/Revenue Ratio",
        `${data.financialSummary.costRevenueRatio.toFixed(1)}%`,
        "Cost as % of revenue",
      ],
      [],
      ["Revenue vs Cost"],
      ["Date", "Revenue", "Cost"],
      [
        data.revenueVsCost.labels[0],
        data.revenueVsCost.revenue[0],
        data.revenueVsCost.cost[0],
      ],
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Financial Summary");

    // Sales Details Sheet
    const salesData = [
      ["Date", "Branch", "Items", "Amount"],
      ...data.salesDetails.map((sale) => [
        sale.date,
        sale.branch,
        sale.items,
        `$${sale.amount.toFixed(2)}`,
      ]),
    ];

    const salesWs = XLSX.utils.aoa_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, salesWs, "Sales Details");

    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "accounts_report.xlsx");
  };

  // Function to handle printing
  const useHandlePrint = (ref: RefObject<HTMLButtonElement>) =>
    useReactToPrint({
      contentRef: ref,
      documentTitle: "Accounts Report",
    });

  return {
    pdf: generatePDF,
    spreadsheet: generateExcel,
    browserPrint: useHandlePrint,
  };
};

export default useAccountReportGenerator;
