"use client";
import domtoimage from "dom-to-image";

import { jsPDF } from "jspdf";
import {
  Download,
  FileImage,
  FileIcon as FilePdf,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Activity } from "@/lib/types";

interface ExportOptionsProps {
  activities: Activity[];
}

export function ExportOptions({ activities }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const scheduleRef = useRef<HTMLDivElement | null>(null);

  // Set the ref to the schedule element
  const setScheduleRef = () => {
    scheduleRef.current = document.querySelector(
      ".weekly-schedule-container"
    ) as HTMLDivElement;
    if (!scheduleRef.current) {
      toast.error("No se pudo encontrar el elemento del horario");
      return false;
    }
    return true;
  };

  // Export to Excel
  const exportToExcel = () => {
    if (activities.length === 0) {
      toast.error("No hay actividades para exportar");
      return;
    }

    setIsExporting(true);

    try {
      // Prepare data for Excel
      const days = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo",
      ];
      const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

      // Create worksheet with headers
      const worksheetData = [["Hora", ...days]];

      // Fill worksheet with empty cells
      hours.forEach((hour) => {
        const row = [hour, ...Array(days.length).fill("")];
        worksheetData.push(row);
      });

      // Place activities in the corresponding cells
      activities.forEach((activity) => {
        const dayIndex = days.indexOf(translateDay(activity.day)) + 1;
        const startHour = parseInt(activity.startTime.split(":")[0], 10);
        const endHour = parseInt(activity.endTime.split(":")[0], 10);

        for (let hour = startHour; hour <= endHour; hour++) {
          const rowIndex = hour + 1;
          if (hour === startHour && hour === endHour) {
            worksheetData[rowIndex][
              dayIndex
            ] = `${activity.title} (${activity.startTime} - ${activity.endTime})`;
          } else if (hour === startHour) {
            worksheetData[rowIndex][
              dayIndex
            ] = `${activity.title} (${activity.startTime})`;
          } else if (hour === endHour) {
            worksheetData[rowIndex][
              dayIndex
            ] = `${activity.title} (${activity.endTime})`;
          } else {
            worksheetData[rowIndex][dayIndex] = activity.title;
          }
        }
      });

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Apply colors to cells
      activities.forEach((activity) => {
        const dayIndex = days.indexOf(translateDay(activity.day)) + 1;
        const startHour = parseInt(activity.startTime.split(":")[0], 10);
        const endHour = parseInt(activity.endTime.split(":")[0], 10);

        for (let hour = startHour; hour <= endHour; hour++) {
          const cellAddress = XLSX.utils.encode_cell({
            r: hour + 1,
            c: dayIndex,
          });
          if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
          // const hexToRgb = (hex: string) => {
          //   const bigint = parseInt(hex.replace("#", ""), 16);
          //   const r = (bigint >> 16) & 255;
          //   const g = (bigint >> 8) & 255;
          //   const b = bigint & 255;
          //   return `rgb(${r},${g},${b})`;
          // };

          worksheet[cellAddress].s = {
            fill: {
              fgColor: { rgb: activity.color.toUpperCase().replace("#", "") },
              bgColor: { rgb: activity.color.toUpperCase().replace("#", "") },
            },
          };
        }
      });

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Horario");

      // Generate Excel file
      XLSX.writeFile(workbook, "mi-horario.xlsx");

      toast.success("Horario exportado como Excel correctamente");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      toast.error("Error al exportar a Excel");
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (activities.length === 0) {
      toast.error("No hay actividades para exportar");
      return;
    }

    if (!setScheduleRef()) return;

    setIsExporting(true);

    try {
      const element = scheduleRef.current as HTMLElement;

      // Create PDF
      const pdf = new jsPDF("landscape", "mm", "a4");

      // Convert HTML to image using dom-to-image
      const dataUrl = await domtoimage.toPng(element, {
        quality: 1,
        bgcolor: "#ffffff",
      });

      // Add image to PDF
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = img.width;
        const imgHeight = img.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 20;

        pdf.addImage(
          dataUrl,
          "PNG",
          imgX,
          imgY,
          imgWidth * ratio,
          imgHeight * ratio
        );

        // Save PDF
        pdf.save("mi-horario.pdf");

        toast.success("Horario exportado como PDF correctamente");
      };
    } catch (error) {
      console.error("Error al exportar a PDF:", error);
      toast.error("Error al exportar a PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Export as image
  const exportAsImage = async () => {
    if (activities.length === 0) {
      toast.error("No hay actividades para exportar");
      return;
    }

    if (!setScheduleRef()) return;

    setIsExporting(true);

    try {
      const element = scheduleRef.current as HTMLElement;

      // Convert HTML to image using dom-to-image
      const dataUrl = await domtoimage.toPng(element, {
        quality: 1,
        bgcolor: "#ffffff",
      });

      // Create a link and download the image
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "mi-horario.png";
      link.click();

      toast.success("Horario exportado como imagen correctamente");
    } catch (error) {
      console.error("Error al exportar como imagen:", error);
      toast.error("Error al exportar como imagen");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to translate day names
  const translateDay = (day: string): string => {
    const dayMap: Record<string, string> = {
      monday: "Lunes",
      tuesday: "Martes",
      wednesday: "Miércoles",
      thursday: "Jueves",
      friday: "Viernes",
      saturday: "Sábado",
      sunday: "Domingo",
    };
    return dayMap[day] || day;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel} disabled={isExporting}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar como Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} disabled={isExporting}>
          <FilePdf className="mr-2 h-4 w-4" />
          Exportar como PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsImage} disabled={isExporting}>
          <FileImage className="mr-2 h-4 w-4" />
          Exportar como Imagen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
