import React, { useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    term: "First Term",
    year: "",
  });

  // Dummy data for demo
  const allData = [
    { id: 1, name: "John Banda", term: "First Term", date: "2025-03-12", score: 78 },
    { id: 2, name: "Mary Phiri", term: "Second Term", date: "2025-07-05", score: 85 },
    { id: 3, name: "James Mvula", term: "Third Term", date: "2025-10-02", score: 90 },
  ];

  // Handle filter change
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Handle search
  const handleSearch = () => {
    const filtered = allData.filter((r) => {
      const date = new Date(r.date);
      const fromDate = filters.from ? new Date(filters.from) : null;
      const toDate = filters.to ? new Date(filters.to) : null;
      const matchTerm = filters.term ? r.term === filters.term : true;
      const matchYear = filters.year ? r.date.includes(filters.year) : true;

      return (
        (!fromDate || date >= fromDate) &&
        (!toDate || date <= toDate) &&
        matchTerm &&
        matchYear
      );
    });
    setReports(filtered);
  };

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Term Reports", 14, 10);
    doc.autoTable({
      startY: 20,
      head: [["#", "Student Name", "Term", "Date", "Score"]],
      body: reports.map((r, i) => [i + 1, r.name, r.term, r.date, r.score]),
    });
    doc.save("term_reports.pdf");
  };

  // Export to Excel
  const exportXLS = () => {
    const worksheet = XLSX.utils.json_to_sheet(reports);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "term_reports.xlsx");
  };

  // Print report
  const printTable = () => {
    const printContent = document.getElementById("reportTable").outerHTML;
    const newWin = window.open("");
    newWin.document.write("<html><head><title>Print Report</title>");
    newWin.document.write(
      `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">`
    );
    newWin.document.write("</head><body>");
    newWin.document.write("<h3 class='text-center my-3'>Term Reports</h3>");
    newWin.document.write(printContent);
    newWin.document.write("</body></html>");
    newWin.document.close();
    newWin.print();
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center fw-bold">Reports</h2>

      {/* Filter Section */}
      <div className="card p-4 shadow-sm mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label">From Date</label>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">To Date</label>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Select Term</label>
            <select
              name="term"
              value={filters.term}
              onChange={handleChange}
              className="form-select"
            >
              <option>First Term</option>
              <option>Second Term</option>
              <option>Third Term</option>
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label">Year</label>
            <input
              type="number"
              name="year"
              value={filters.year}
              onChange={handleChange}
              placeholder="2025"
              className="form-control"
            />
          </div>

          <div className="col-md-1 text-center">
            <button className="btn btn-primary w-100" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card p-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Search Results</h5>
          <div className="d-flex gap-2">
            <button className="btn btn-success btn-sm" onClick={exportXLS}>
              Export XLS
            </button>
            <button className="btn btn-danger btn-sm" onClick={exportPDF}>
              Export PDF
            </button>
            <button className="btn btn-secondary btn-sm" onClick={printTable}>
              Print
            </button>
          </div>
        </div>

        {reports.length === 0 ? (
          <p className="text-muted text-center mb-0">No reports found.</p>
        ) : (
          <div className="table-responsive">
            <table
              id="reportTable"
              className="table table-striped table-bordered align-middle"
            >
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Term</th>
                  <th>Date</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, index) => (
                  <tr key={r.id}>
                    <td>{index + 1}</td>
                    <td>{r.name}</td>
                    <td>{r.term}</td>
                    <td>{r.date}</td>
                    <td>{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
