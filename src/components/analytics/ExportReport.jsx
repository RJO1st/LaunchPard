"use client";
// ============================================================================
// ExportReport - PDF Report Generator for Parent Analytics
// ============================================================================
import React, { useState } from "react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getCurriculumInfo, formatGradeLabel, getLevelInfo } from "@/lib/gamificationEngine";

const DownloadIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
    <line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);

export default function ExportReport({ scholar, results, percentiles, subjectStats }) {
  const [exporting, setExporting] = useState(false);

  const generatePDF = () => {
    if (!scholar || !results || results.length === 0) {
      alert('Not enough data to generate report');
      return;
    }

    setExporting(true);

    try {
      const doc = new jsPDF();
      const curriculumInfo = getCurriculumInfo(scholar.curriculum);
      const levelInfo = getLevelInfo(scholar.xp || 0);

      // ─── HEADER ─────────────────────────────────────────────────────────
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('LaunchPard Progress Report', 20, 20);

      // Scholar Info Box
      doc.setFillColor(240, 240, 255);
      doc.roundedRect(15, 28, 180, 35, 3, 3, 'F');

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Scholar Information', 20, 38);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${scholar.name}`, 20, 45);
      doc.text(`Codename: ${scholar.codename}`, 20, 51);
      doc.text(`Curriculum: ${curriculumInfo.country} ${curriculumInfo.name}`, 20, 57);
      doc.text(`${curriculumInfo.gradeLabel}: ${scholar.year_level}`, 115, 45);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 115, 51);
      doc.text(`Member Since: ${new Date(scholar.created_at).toLocaleDateString()}`, 115, 57);

      // ─── SUMMARY STATISTICS ─────────────────────────────────────────────
      let yPos = 75;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', 20, yPos);

      yPos += 10;
      const totalQuizzes = results.length;
      const avgAccuracy = Math.round(
        results.reduce((sum, r) => sum + r.accuracy, 0) / totalQuizzes
      );
      const totalCorrect = results.reduce((sum, r) => sum + (r.correct_count || 0), 0);
      const totalQuestions = results.reduce((sum, r) => sum + (r.total_questions || 0), 0);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const stats = [
        ['Total Quizzes Completed', totalQuizzes],
        ['Average Accuracy', `${avgAccuracy}%`],
        ['Total Questions Answered', totalQuestions],
        ['Total Correct Answers', totalCorrect],
        ['Current Level', `${levelInfo.current.level} - ${levelInfo.current.title}`],
        ['Total XP Earned', (scholar.xp || 0).toLocaleString()],
        ['Current Streak', `${scholar.streak || 0} days`],
        ['Coins Balance', `${curriculumInfo.currency}${scholar.coins || 0}`],
      ];

      stats.forEach(([label, value], i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = col === 0 ? 20 : 115;
        const y = yPos + (row * 7);
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, x, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), x + 60, y);
      });

      // ─── PERFORMANCE BY SUBJECT ─────────────────────────────────────────
      yPos += 35;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Performance by Subject', 20, yPos);

      yPos += 5;
      const tableData = Object.entries(subjectStats || {}).map(([subject, stats]) => {
        const avg = Math.round(stats.total / stats.count);
        const percentileData = percentiles?.find(p => p.subject === subject);
        const topPercent = percentileData ? 100 - percentileData.percentile : 'N/A';
        
        return [
          subject.charAt(0).toUpperCase() + subject.slice(1),
          stats.count,
          `${avg}%`,
          topPercent === 'N/A' ? 'N/A' : `Top ${topPercent}%`,
        ];
      });

      doc.autoTable({
        startY: yPos,
        head: [['Subject', 'Quizzes', 'Avg Accuracy', 'Percentile']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
        styles: { fontSize: 10, font: 'helvetica' },
        alternateRowStyles: { fillColor: [245, 245, 250] },
      });

      // ─── PEER COMPARISON ────────────────────────────────────────────────
      yPos = doc.lastAutoTable.finalY + 15;
      
      if (percentiles && percentiles.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Peer Comparison', 20, yPos);

        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        percentiles.forEach((p, i) => {
          const text = `${p.subject.charAt(0).toUpperCase() + p.subject.slice(1)}: ` +
                      `${p.scholarAvg}% average, better than ${p.percentile}% of ${p.cohortSize} peers ` +
                      `(Top ${100 - p.percentile}%)`;
          
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.text(text, 20, yPos, { maxWidth: 170 });
          yPos += 7;
        });
      }

      // ─── RECOMMENDATIONS ────────────────────────────────────────────────
      yPos += 10;
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommendations', 20, yPos);

      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Find weakest subject
      const sortedSubjects = Object.entries(subjectStats || {})
        .sort((a, b) => (a[1].total / a[1].count) - (b[1].total / b[1].count));
      
      const weakestSubject = sortedSubjects[0];
      const strongestSubject = sortedSubjects[sortedSubjects.length - 1];

      const recommendations = [
        `Focus on ${weakestSubject[0]} - practice 15-20 minutes daily to improve`,
        `Maintain current ${strongestSubject[0]} performance with regular review`,
        `Current ${scholar.streak || 0}-day streak is ${scholar.streak >= 7 ? 'excellent' : 'building'} - aim for 30 days`,
        `Complete daily quests for bonus XP and streak shields`,
        avgAccuracy >= 90 
          ? 'Excellent work! Consider exploring more challenging topics'
          : 'Target 90% accuracy for mastery - review incorrect answers',
        `XP Progress: ${levelInfo.progressPct}% toward Level ${levelInfo.next?.level || 'Max'}`,
      ];

      recommendations.forEach((rec, i) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`• ${rec}`, 20, yPos, { maxWidth: 170 });
        yPos += 10;
      });

      // ─── FOOTER ─────────────────────────────────────────────────────────
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150);
        doc.text(
          `LaunchPard Progress Report - Page ${i} of ${pageCount} - Generated ${new Date().toLocaleDateString()}`,
          105,
          290,
          { align: 'center' }
        );
      }

      // Save PDF
      const filename = `LaunchPard_Report_${scholar.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={exporting || !results || results.length === 0}
      className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-black hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <DownloadIcon size={20} />
      {exporting ? 'Generating PDF...' : 'Export PDF Report'}
    </button>
  );
}