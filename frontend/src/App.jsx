import { useEffect, useRef, useState } from "react";
import "./App.css";
import Login from "./login";
import Signup from "./signup";
import ResetPassword from "./ResetPassword";
import Admin from "./Admin";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function App() {
    const isResetPasswordPage =
    window.location.pathname === "/reset-password";

  

  const [showSignup, setShowSignup] = useState(false);
  
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("diagnostic");
  const [patients, setPatients] = useState([]);
const [patientsLoading, setPatientsLoading] = useState(false);
  
const [patientName, setPatientName] = useState("");
const [patientId, setPatientId] = useState("");
const [patientAge, setPatientAge] = useState("");
const [selectedPatient, setSelectedPatient] = useState(null);
const [patientSearch, setPatientSearch] = useState("");

const [isLoggedIn, setIsLoggedIn] = useState(
  () => !!sessionStorage.getItem("neuroscan_token")
);
const [showProfileMenu, setShowProfileMenu] = useState(false);
const [latestScanImage, setLatestScanImage] = useState(null);


  const handleLogout = () => {
  sessionStorage.removeItem("neuroscan_token");
  sessionStorage.removeItem("neuroscan_user");

  setShowProfileMenu(false);
  setIsLoggedIn(false);
};

const currentUser = JSON.parse(
  sessionStorage.getItem("neuroscan_user") || "null"
);

const isAdmin = currentUser?.role === "Admin";

useEffect(() => {
  let objectUrl;

  const loadLatestScanImage = async () => {
    const scans = selectedPatient?.scans || [];
    const latestScan = scans[scans.length - 1];

    if (!latestScan?.id) {
      setLatestScanImage(null);
      return;
    }

    try {
      const token = sessionStorage.getItem("neuroscan_token");

      const response = await fetch(
        `http://127.0.0.1:8000/scans/${latestScan.id}/image`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Image request failed: ${response.status}`);
      }

      const imageBlob = await response.blob();
      objectUrl = URL.createObjectURL(imageBlob);
      setLatestScanImage(objectUrl);
    } catch (error) {
      console.error("Failed to load protected MRI image:", error);
      setLatestScanImage(null);
    }
  };

  loadLatestScanImage();

  return () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  };
}, [selectedPatient]);



  const fetchPatients = async () => {
    setPatientsLoading(true);

    try {
      const token = sessionStorage.getItem("neuroscan_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch("http://127.0.0.1:8000/patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to load patients");
      }

      const data = await response.json();

      const formattedPatients = await Promise.all(
        data.map(async (patient) => {
          try {
            const scansResponse = await fetch(
              `http://127.0.0.1:8000/patients/${patient.id}/scans`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!scansResponse.ok) {
              throw new Error("Failed to load scans");
            }

            const savedScans = await scansResponse.json();


const scans = savedScans.map((scan) => ({
  id: scan.id,
  diagnosis: scan.diagnosis,
  confidence: scan.confidence,
  mri: scan.id
    ? `http://127.0.0.1:8000/scans/${scan.id}/image`
    : null,
  date: scan.scan_date
    ? new Date(scan.scan_date).toLocaleDateString()
    : "",
}));

           const latestScan = [...scans].sort(
  (a, b) => b.id - a.id
)[0];

            return {
              id: patient.id,
              patientCode: patient.patient_code,
              name: patient.name,
              age: patient.age,
              diagnosis: latestScan?.diagnosis || "Not analyzed",
              confidence: latestScan?.confidence ?? null,
              mri: latestScan?.mri || null,
              date: latestScan?.date || "",
              scans,
            };
          } catch (error) {
            console.error(
              `Could not load scans for patient ${patient.id}:`,
              error
            );

            return {
              id: patient.id,
              patientCode: patient.patient_code,
              name: patient.name,
              age: patient.age,
              diagnosis: "Not analyzed",
              confidence: null,
              mri: null,
              date: "",
              scans: [],
            };
          }
        })
      );

      setPatients(formattedPatients);
    } catch (err) {
      console.error("Error loading patients:", err);
      setError("Could not load patient records.");
    } finally {
      setPatientsLoading(false);
    }
  };
const handleDeletePatient = async (patient) => {
  const confirmed = window.confirm(
    `Soft-delete patient ${patient.name}? You can restore them later.`
  );

  if (!confirmed) return;

  try {
    const token = sessionStorage.getItem("neuroscan_token");

    const response = await fetch(
      `http://127.0.0.1:8000/patients/${patient.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete patient");
    }

    setPatients((prev) =>
      prev.filter((p) => p.id !== patient.id)
    );

    if (selectedPatient?.id === patient.id) {
      setSelectedPatient(null);
    }

    alert("Patient soft-deleted successfully.");
  } catch (error) {
    console.error("Error deleting patient:", error);
    alert("Could not delete patient. Please try again.");
  }
};

 useEffect(() => {
    if (isLoggedIn) {
      fetchPatients();
    }
  }, [isLoggedIn]);

  const diagnosisData = [
  {
    diagnosis: "Glioma",
    count: patients.reduce(
      (total, patient) =>
        total +
        (patient.scans || []).filter(
          (scan) => scan.diagnosis?.toLowerCase() === "glioma"
        ).length,
      0
    ),
  },
  {
    diagnosis: "Meningioma",
    count: patients.reduce(
      (total, patient) =>
        total +
        (patient.scans || []).filter(
          (scan) => scan.diagnosis?.toLowerCase() === "meningioma"
        ).length,
      0
    ),
  },
  {
    diagnosis: "Pituitary",
    count: patients.reduce(
      (total, patient) =>
        total +
        (patient.scans || []).filter(
          (scan) => scan.diagnosis?.toLowerCase() === "pituitary"
        ).length,
      0
    ),
  },
  {
    diagnosis: "No Tumor",
    count: patients.reduce(
      (total, patient) =>
        total +
        (patient.scans || []).filter(
          (scan) => scan.diagnosis?.toLowerCase() === "notumor"
        ).length,
      0
    ),
  },
];

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
   const file = event.target.files[0];

if (!file) return;


    setSelectedFile(file);
    setResult(null);
    setError("");

    // Show MRI preview
    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);

    // Send image to FastAPI
    const formData = new FormData();
    formData.append("file", file);
    if (!selectedPatient?.id) {
  setError("Please select or add a patient before uploading an MRI.");
  return;
}

formData.append("patient_id", selectedPatient.id);

    setLoading(true);

    
try {
  const token = sessionStorage.getItem("neuroscan_token");

  const response = await fetch(
    `http://127.0.0.1:8000/predict?patient_id=${selectedPatient.id}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("API ERROR:", errorData);

    throw new Error(
      errorData.detail
        ? JSON.stringify(errorData.detail)
        : "Prediction failed"
    );
  }

  const data = await response.json();

  console.log("AI RESULT:", data);
  setResult(data);

  // Keep the rest of your existing code here

      setResult(data);

      // Update the selected patient's record
      if (selectedPatient) {

  const newScan = {
    mri: file.name,
    image: `http://127.0.0.1:8000${data.image_url}`,
    diagnosis: data.prediction,
    confidence: data.confidence,
    date: new Date().toLocaleDateString(),
  };

  setPatients((prevPatients) =>
    prevPatients.map((patient) =>
      patient.id === selectedPatient.id
        ? {
            ...patient,
            diagnosis: data.prediction,
            confidence: data.confidence,
            date: newScan.date,
            scans: [
              ...(patient.scans || []),
              newScan,
            ],
          }
        : patient
    )
  );

  setSelectedPatient((prev) => ({
    ...prev,
    diagnosis: data.prediction,
    confidence: data.confidence,
    date: newScan.date,
    scans: [
      ...(prev.scans || []),
      newScan,
    ],
  }));
}

    } catch (err) {
      console.error("Prediction error:", err);

      setError(
        err.message || "Prediction failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // Save a new patient
  
  // Save a new patient to MySQL
  const savePatient = async () => {
    if (!patientName.trim() || !patientId.trim() || !patientAge) {
      alert("Please enter Patient Name, Patient ID and Age.");
      return;
    }

    try {
      const token = sessionStorage.getItem("neuroscan_token");

      if (!token) {
        alert("Your session has expired. Please log in again.");
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },

        body: JSON.stringify({
          patient_code: patientId.trim(),
          name: patientName.trim(),
          age: Number(patientAge),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not save patient.");
      }

      const newPatient = {
        id: data.id,
        patientCode: data.patient_code,
        name: data.name,
        age: data.age,
        diagnosis: "Not analyzed",
        confidence: null,
        mri: null,
        date: new Date().toLocaleDateString(),
        scans: [],
      };

      setPatients((prev) => [...prev, newPatient]);
      setSelectedPatient(newPatient);

      setPatientName("");
      setPatientId("");
      setPatientAge("");
      setActivePage("diagnostic");
    } catch (err) {
      alert(err.message || "Could not save patient.");
    }
    setActivePage("diagnostic");
  };
if (isResetPasswordPage) {
    return <ResetPassword />;
  }

if (!isLoggedIn) {
  if (showSignup) {
  return (
    <Signup
      onSignup={() => setShowSignup(false)}
      onLogin={() => setShowSignup(false)}
    />
  );
}
  return (
    <Login
      onLogin={() => setIsLoggedIn(true)}
      onSignup={() => setShowSignup(true)}
    />
  );
}

return (
  <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="logo">
          🧠 NeuroScan
        </div>

        <nav>

          <div
  className={`nav-item ${
    activePage === "diagnostic" ? "active" : ""
  }`}
  onClick={() => setActivePage("diagnostic")}
>
  ▣ Diagnostic Workspace
</div>

<div
  className={`nav-item ${
    activePage === "patients" ? "active" : ""
  }`}
  onClick={() => setActivePage("patients")}
>
  ▣ Patient Records
</div>

<div
  className={`nav-item ${
    activePage === "analytics" ? "active" : ""
  }`}
  onClick={() => setActivePage("analytics")}
>
  ▣ Analytics Dashboard
</div>

<div
  className={`nav-item ${
    activePage === "reports" ? "active" : ""
  }`}
  onClick={() => setActivePage("reports")}
>
  ▣ Reports
</div>
{isAdmin && (
  <div
    className={`nav-item ${
      activePage === "admin" ? "active" : ""
    }`}
    onClick={() => setActivePage("admin")}
  >
    ▣ Admin Approvals
  </div>
)}

        </nav>

       
      </aside>


      {/* Main area */}
      <main className="main">
{/* Top bar */}
<header className="topbar">
{activePage === "patients" && (
  <input
    type="text"
    placeholder="Search by name or Patient ID..."
    value={patientSearch}
    onChange={(e) => setPatientSearch(e.target.value)}
  />
)}
 

 <div className="doctor">

  <div
    className="doctor-profile"
    onClick={() => setShowProfileMenu(!showProfileMenu)}
  >
    <div className="doctor-avatar">
      {JSON.parse(sessionStorage.getItem("neuroscan_user"))?.name
        ?.charAt(0)
        .toUpperCase() || "U"}
    </div>

    <div className="doctor-info">
      <strong>
        {JSON.parse(sessionStorage.getItem("neuroscan_user"))?.name || "User"}
      </strong>

        <span>
    {JSON.parse(sessionStorage.getItem("neuroscan_user"))?.role || "Doctor"}
  </span>
    </div>
  </div>

  {showProfileMenu && (
    <div className="profile-menu">
      <button
        onClick={handleLogout}
        className="logout-button"
      >
        Logout
      </button>
    </div>
  )}

</div>

</header>

        {/* Workspace */}
       {activePage === "admin" && isAdmin ? (
  <Admin />
) : activePage === "patients" ? (
  <section className="workspace">

    <h2>Patient Records</h2>

    <div className="diagnostic-card">

      <h3>Add Patient</h3>

      <input
        type="text"
        placeholder="Patient Name"
        value={patientName}
        onChange={(e) => setPatientName(e.target.value)}
      />

      <input
        type="text"
        placeholder="Patient ID"
        value={patientId}
        onChange={(e) => setPatientId(e.target.value)}
      />

      <input
        type="number"
        placeholder="Age"
        value={patientAge}
        onChange={(e) => setPatientAge(e.target.value)}
      />

      <button onClick={savePatient}>
        Save Patient
      </button>

    </div>

   <div className="diagnostic-card">

  <div className="patients-header">
    <h3>Saved Patients</h3>

    
  </div>

  {patients.length === 0 ? (

    <p>No patient records yet.</p>

  ) : (

    <div className="patient-grid">

      {patients
        .filter((patient) =>
          patient.name
            .toLowerCase()
            .includes(patientSearch.toLowerCase()) ||
          patient.id
            .toString()
            .toLowerCase()
            .includes(patientSearch.toLowerCase())
        )
        .map((patient) => (

          <div
            key={patient.id}
            className="patient-record"
          >

            <h3>{patient.name}</h3>

            <p>
              <strong>Patient ID:</strong> {patient.id}
            </p>

            <p>
              <strong>Age:</strong> {patient.age}
            </p>

            <p>
              <strong>Diagnosis:</strong>{" "}
              {patient.diagnosis || "Not analyzed"}
            </p>

            {patient.confidence && (
              <p>
                <strong>Confidence:</strong>{" "}
                {patient.confidence}%
              </p>
            )}


            <p>
              <strong>Date:</strong> {patient.date}
            </p>

            <div className="patient-actions">

              <button
                onClick={() => {
                  setSelectedPatient(patient);
                  setActivePage("diagnostic");
                }}
              >
                Open Patient
              </button>

              <button
  className="delete-button"
  onClick={() => handleDeletePatient(patient)}
>
  Delete
</button>
            </div>

          </div>

        ))}

    </div>

  )}
  <div className="diagnostic-card scan-history">

  <div className="scan-history-header">
    <h3>Scan History</h3>
    <span>All Patients</span>
  </div>

  {patients.every(
    (patient) => !patient.scans || patient.scans.length === 0
  ) ? (
    <p>No scans available yet.</p>
  ) : (
    <div className="scan-history-list">

      {patients.flatMap((patient) =>
        (patient.scans || []).map((scan, index) => (
          <div
            className="scan-history-item"
            key={`${patient.id}-${index}`}
          >

  
<div className="scan-info">
  <strong>{patient.name}</strong>
  <span>Patient ID: {patient.id}</span>
  <span>{scan.date}</span>
</div>



            <div className="scan-diagnosis">
              <span>Diagnosis</span>
              <strong>{scan.diagnosis}</strong>
            </div>

            <div className="scan-confidence">
              <span>Confidence</span>
              <strong>{scan.confidence}%</strong>
            </div>

          </div>
        ))
      )}
    </div>
  )}

  </div>

  </div>

  </section>
) : activePage === "analytics" ? (
  <section className="workspace">

    <h2>Analytics Dashboard</h2>

    <div className="analytics-grid">

      {/* Total Patients */}
      <div className="diagnostic-card analytics-card">
        <span className="analytics-label">
          TOTAL PATIENTS
        </span>

        <h3>{patients.length}</h3>
      </div>

      {/* Total Scans */}
      <div className="diagnostic-card analytics-card">
        <span className="analytics-label">
          TOTAL MRI SCANS
        </span>

        <h3>
          {patients.reduce(
            (total, patient) =>
              total + (patient.scans?.length || 0),
            0
          )}
        </h3>
      </div>

      {/* Glioma */}
      <div className="diagnostic-card analytics-card">
        <span className="analytics-label">
          GLIOMA
        </span>

        <h3>
          {patients.reduce(
            (total, patient) =>
              total +
              (patient.scans || []).filter(
                (scan) =>
                  scan.diagnosis?.toLowerCase() === "glioma"
              ).length,
            0
          )}
        </h3>
      </div>

      {/* Meningioma */}
      <div className="diagnostic-card analytics-card">
        <span className="analytics-label">
          MENINGIOMA
        </span>

        <h3>
          {patients.reduce(
            (total, patient) =>
              total +
              (patient.scans || []).filter(
                (scan) =>
                  scan.diagnosis?.toLowerCase() === "meningioma"
              ).length,
            0
          )}
        </h3>
      </div>

      {/* Pituitary */}
      <div className="diagnostic-card analytics-card">
        <span className="analytics-label">
          PITUITARY
        </span>

        <h3>
          {patients.reduce(
            (total, patient) =>
              total +
              (patient.scans || []).filter(
                (scan) =>
                  scan.diagnosis?.toLowerCase() === "pituitary"
              ).length,
            0
          )}
        </h3>
      </div>

      {/* No Tumor */}
      <div className="diagnostic-card analytics-card">
        <span className="analytics-label">
          NO TUMOR
        </span>

        <h3>
          {patients.reduce(
            (total, patient) =>
              total +
              (patient.scans || []).filter(
                (scan) =>
                  scan.diagnosis?.toLowerCase() === "notumor"
              ).length,
            0
          )}
        </h3>
      </div>

    </div>
    <div className="analytics-charts">

  {/* Diagnosis Distribution */}
  <div className="diagnostic-card analytics-chart-card">

    <div className="chart-header">
      <div>
        <h3>Diagnosis Distribution</h3>
        <p>AI-detected conditions across all MRI scans</p>
      </div>
    </div>

    <div className="analytics-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={diagnosisData}
          margin={{
            top: 10,
            right: 10,
            left: -20,
            bottom: 5,
          }}
        >

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="diagnosis"
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip />

          <Bar
            dataKey="count"
            name="Cases"
            radius={[8, 8, 0, 0]}
            barSize={42}
          />

        </BarChart>
      </ResponsiveContainer>
    </div>

  </div>

  {/* Summary */}
  <div className="diagnostic-card analytics-summary-card">

    <div className="chart-header">
      <div>
        <h3>Scan Summary</h3>
        <p>Current diagnostic activity</p>
      </div>
    </div>

    <div className="summary-list">

      <div className="summary-row">
        <span>Total scans</span>
        <strong>
          {patients.reduce(
            (total, patient) =>
              total + (patient.scans?.length || 0),
            0
          )}
        </strong>
      </div>

      <div className="summary-row">
        <span>Patients analyzed</span>
        <strong>
          {
            patients.filter(
              (patient) =>
                patient.scans && patient.scans.length > 0
            ).length
          }
        </strong>
      </div>

      <div className="summary-row">
        <span>Unanalyzed patients</span>
        <strong>
          {
            patients.filter(
              (patient) =>
                !patient.scans ||
                patient.scans.length === 0
            ).length
          }
        </strong>
      </div>

    </div>

  </div>

</div>
  </section>
) : activePage === "reports" ? (
  <section className="workspace reports-page">

    {!selectedPatient ? (
      <div className="report-empty">
        <h2>No Patient Selected</h2>
        <p>
          Open a patient from Patient Records to generate a diagnostic report.
        </p>
      </div>
    ) : (
      <div className="medical-report">

        {/* Report Header */}
        <div className="report-header">
          <div>
            <h1>NEUROSCAN</h1>
            <p>AI-ASSISTED BRAIN MRI ANALYSIS REPORT</p>
          </div>

          <div className="report-meta">
            <span>
              <strong>Report ID:</strong> NS-{selectedPatient.id}
            </span>
            <span>
              <strong>Date:</strong>{" "}
              {selectedPatient.date || new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Patient Information */}
        <div className="report-section">
          <h2>Patient Information</h2>

          <div className="report-info-grid">
            <div>
              <span>Patient Name</span>
              <strong>{selectedPatient.name}</strong>
            </div>

            <div>
              <span>Patient ID</span>
              <strong>{selectedPatient.id}</strong>
            </div>

            <div>
              <span>Age</span>
              <strong>{selectedPatient.age}</strong>
            </div>
          </div>
                </div>

        {/* MRI Examination */}
        <div className="report-section">
          <h2>MRI Examination</h2>

          {selectedPatient?.scans?.length ? (
            <>
              <div className="report-mri">
                <img
                  src={latestScanImage || undefined}
                  alt="Analyzed MRI"
                  className="report-mri-image"
                  style={{
                    display: latestScanImage ? "block" : "none",
                  }}
                />
              </div>

 
    


  
            </>
          ) : (
            <p className="no-scans">
              MRI image is not available for this scan.
            </p>
          )}
        </div>

        {/* Latest Diagnosis */}
        <div className="report-section">
          <h2>AI Analysis Result</h2>

          <div className="diagnosis-result">

            <div className="diagnosis-main">
              <span>Predicted Diagnosis</span>

              <h3>
                {selectedPatient.diagnosis === "notumor"
                  ? "No Tumor"
                  : selectedPatient.diagnosis
                    ? selectedPatient.diagnosis.charAt(0).toUpperCase() +
                      selectedPatient.diagnosis.slice(1)
                    : "Not analyzed"}
              </h3>
            </div>

            <div className="diagnosis-confidence">
              <span>AI Confidence</span>

              <strong>
                {selectedPatient.confidence != null
                  ? `${selectedPatient.confidence}%`
                  : "—"}
              </strong>
            </div>

            <div className="diagnosis-date">
              <span>Analysis Date</span>

              <strong>
                {selectedPatient.date || "—"}
              </strong>
            </div>

          </div>
        </div>

        

        {/* Report Summary */}
        <div className="report-section">
          <h2>Report Summary</h2>

          <p className="report-summary">
            The NeuroScan AI model classified the latest uploaded MRI scan as{" "}
            <strong>
              {selectedPatient.diagnosis === "notumor"
                ? "No Tumor"
                : selectedPatient.diagnosis
                  ? selectedPatient.diagnosis.charAt(0).toUpperCase() +
                    selectedPatient.diagnosis.slice(1)
                  : "Not analyzed"}
            </strong>{" "}
            with an AI confidence score of{" "}
            <strong>
              {selectedPatient.confidence != null
                ? `${selectedPatient.confidence}%`
                : "—"}
            </strong>.
          </p>

          <div className="report-disclaimer">
            <strong>Important:</strong> This is an AI-generated analysis
            intended to assist medical review. It is not a substitute for
            evaluation and diagnosis by a qualified medical professional.
          </div>
        </div>

        {/* Actions */}
        <div className="report-actions">
          <button
            className="print-report-button"
            onClick={() => window.print()}
          >
            Print / Generate Report
          </button>
        </div>

      </div>
    )}

  </section>
) : (
  <section className="workspace">

    <h2>Diagnostic Workspace</h2>
  {selectedPatient ? (
    <div className="selected-patient">

      <div>
        <span className="patient-label">CURRENT PATIENT</span>
        <h2>{selectedPatient.name}</h2>
      </div>

      <div className="patient-details">
        <span>
          <strong>Patient ID:</strong> {selectedPatient.id}
        </span>

        <span>
          <strong>Age:</strong> {selectedPatient.age}
        </span>

        <span>
          <strong>Diagnosis:</strong>{" "}
          {selectedPatient.diagnosis || "Not analyzed"}
        </span>

        {selectedPatient.confidence && (
          <span>
            <strong>Confidence:</strong>{" "}
            {selectedPatient.confidence}%
          </span>
        )}
      </div>

    </div>
    
  ) : (
    <div className="diagnostic-card">
    </div>
  )}

  <div className="content">

{/* MRI Area */}
<div className="scan-area">
  <div className={`scan-placeholder ${preview ? "has-preview" : ""}`}>
    {preview ? (
      <img
        src={preview}
        alt="Uploaded MRI"
        className="mri-preview-image"
      />
    ) : (
      <div className="mri-empty-state">
        <div className="mri-icon">✚</div>
        <h3>MRI Image Viewer</h3>
        <p>Upload a brain MRI image to begin analysis</p>
        <span>Supported image formats: JPG, PNG, JPEG</span>
      </div>
    )}
  </div>

  {/* Hidden file input */}
  <input
    type="file"
    accept="image/*"
    ref={fileInputRef}
    onChange={handleFileChange}
    style={{ display: "none" }}
  />

  {/* Upload button */}
  <button
    onClick={handleUploadClick}
    disabled={!selectedPatient || loading}
    className="mri-upload-button"
  >
    {loading
      ? "Analyzing MRI..."
      : preview
        ? "Choose Another MRI"
        : "Upload MRI"}
  </button>

  {!selectedPatient && (
    <p className="mri-helper-text">Select a patient before uploading a scan.</p>
  )}
</div>

      
    {/* Diagnostics */}
    <div className="diagnostics">

      <h3>AI DIAGNOSTICS</h3>

      <div className="diagnostic-card">

        {!result && !loading && !error && (
          <>
            <p>TUMOR DETECTION</p>

            <h1>No Scan Yet</h1>

            <span>
              Upload an MRI to begin analysis
            </span>
          </>
        )}

        {loading && (
          <>
            <p>AI ANALYSIS</p>

            <h1>Analyzing...</h1>

            <span>
              The AI model is analyzing the MRI scan.
            </span>
          </>
        )}

        {result && (
          <>
            <p>AI DIAGNOSIS</p>

            <h1>{result.prediction}</h1>

            <h2>
              {result.confidence}% Confidence
            </h2>

            <span>
              Prediction completed successfully
            </span>
          </>
        )}

        {error && (
          <>
            <p>ERROR</p>

            <h1>Unable to Analyze</h1>

            <span>{error}</span>
          </>
        )}

      </div>

    </div>

  </div>

</section>
)}
      </main>

    </div>
  );
}

export default App;