import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import i18next from 'i18next';
import { NotoSansRegular } from '../fonts/NotoSans-Regular.js';

const PDFPreviewModal = ({ isOpen, onClose, selectedVehicles, vehicles }) => {
  const { t } = useTranslation();
  const iframeRef = useRef(null);

  useEffect(() => {
    if (isOpen && selectedVehicles.length > 0) {
      generatePDF();
    }
  }, [isOpen, selectedVehicles]);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.addFileToVFS('NotoSans-Regular.ttf', NotoSansRegular);
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    doc.setFont('NotoSans');
    
    // Add title
    doc.setFontSize(20);
    doc.text(t('vehicles.export.title'), 14, 20);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`${t('common.generatedOn')}: ${new Date().toLocaleDateString(i18next.language)}`, 14, 30);
    
    // Add selected vehicles count
    doc.text(`${t('common.totalVehicles')}: ${selectedVehicles.length}`, 14, 40);
    
    // Add typeValueToKey mapping for vehicle types
    const typeValueToKey = {
      "Vieglais auto": "car",
      "Car": "car",
      "Kravas auto": "truck",
      "Truck": "truck",
      "Piekabe": "trailer",
      "Trailer": "trailer",
      "Autobuss": "bus",
      "Bus": "bus",
      "Mopēds": "moped",
      "Moped": "moped",
      "Motocikls": "motorcycle",
      "Motorcycle": "motorcycle",
      "Tricikls": "tricycle",
      "Tricycle": "tricycle",
      "Laiva": "boat",
      "Boat": "boat",
      "Kuģis": "ship",
      "Ship": "ship",
      "Cits": "other",
      "Other": "other"
    };
    
    // Filter vehicles based on selection
    const selectedVehiclesData = vehicles.filter(v => selectedVehicles.includes(v.id));
    
    // Prepare table data
    const tableData = selectedVehiclesData.map(vehicle => [
      vehicle.id,
      vehicle.make,
      vehicle.model,
      vehicle.year,
      t('vehicles.vehicleTypes.' + (typeValueToKey[vehicle.type] || 'other')),
      t('vehicles.statusOptions.' + (vehicle.status ? vehicle.status.toLowerCase() : 'unknown')),
      vehicle.mileage || '-'
    ]);
    
    // Add vehicles table
    autoTable(doc, {
      startY: 50,
      head: [
        [
          t('vehicles.licensePlate'),
          t('vehicles.make'),
          t('vehicles.model'),
          t('vehicles.year'),
          t('vehicles.type'),
          t('vehicles.status'),
          t('vehicles.mileage')
        ]
      ],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, font: 'NotoSans' },
      headStyles: { fillColor: [41, 128, 185], font: 'NotoSans', fontStyle: 'normal' }
    });
    
    // Add reminders section
    let yPos = doc.lastAutoTable.finalY + 20;
    
    selectedVehiclesData.forEach(vehicle => {
      if (vehicle.reminders && vehicle.reminders.length > 0) {
        // Add vehicle header
        doc.setFont('NotoSans');
        doc.setFontSize(12);
        doc.text(`${vehicle.make} ${vehicle.model} (${vehicle.id}) - ${t('vehicles.reminders.title')}`, 14, yPos);
        yPos += 10;
        
        // Add reminders table
        const reminderData = vehicle.reminders
          .filter(r => r.enabled)
          .map(r => [
            t(getReminderTranslationKey(r.name)),
            new Date(r.date).toLocaleDateString(i18next.language),
            getReminderStatusTranslated(r.date)
          ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [[
            t('vehicles.reminders.reminder'),
            t('vehicles.reminders.dueDate'),
            t('vehicles.reminders.status')
          ]],
          body: reminderData,
          theme: 'grid',
          styles: { fontSize: 8, font: 'NotoSans' },
          headStyles: { fillColor: [41, 128, 185], font: 'NotoSans', fontStyle: 'normal' }
        });
        
        yPos = doc.lastAutoTable.finalY + 20;
      }
    });
    
    // Get PDF as data URL
    const pdfDataUrl = doc.output('datauristring');
    
    // Set the iframe source to the PDF data URL
    if (iframeRef.current) {
      iframeRef.current.src = pdfDataUrl;
    }
  };

  const getReminderStatus = (date) => {
    const dueDate = new Date(date);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Overdue';
    } else if (diffDays <= 30) {
      return 'Due Soon';
    } else {
      return 'On Track';
    }
  };

  const handleDownload = () => {
    if (iframeRef.current) {
      const link = document.createElement('a');
      link.href = iframeRef.current.src;
      link.download = `vehicle-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Helper to get translation key for reminder name
  function getReminderTranslationKey(name) {
    // Map known reminder names to translation keys
    const map = {
      'Service Due': 'dashboard.serviceDue',
      'Insurance Renewal': 'dashboard.insuranceRenewal',
      'Road Worthiness Certificate': 'vehicles.reminders.roadWorthinessCertificate',
      'Custom Reminder': 'vehicles.reminders.customReminder'
    };
    return map[name] || name;
  }

  // Helper to get translated reminder status
  function getReminderStatusTranslated(date) {
    const dueDate = new Date(date);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return t('vehicles.reminders.overdue', { days: Math.abs(diffDays) });
    } else if (diffDays === 0) {
      return t('vehicles.reminders.dueToday');
    } else if (diffDays <= 30) {
      return t('vehicles.reminders.dueSoon');
    } else {
      return t('vehicles.reminders.onTrack');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] h-[600px] flex flex-col dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-white">{t('vehicles.export.title')}</h2>
          <div className="flex space-x-2">
            <button 
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
              onClick={handleDownload}
            >
              <span className="mr-2">⬇️</span>{t('vehicles.export.download')}
            </button>
            <button 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              onClick={onClose}
            >
              <span className="text-xl">✖️</span>
            </button>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-hidden">
          <iframe 
            ref={iframeRef}
            className="w-full h-full border-0"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal; 