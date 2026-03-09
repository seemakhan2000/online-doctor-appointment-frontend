"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { showToast } from "../../utils/toast";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
}

export default function BookAppointment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorIdFromUrl = searchParams.get("doctorId");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slot, setSlot] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      if (selectedDoctor && slot) {
        localStorage.setItem("redirectAction", "booking");
        localStorage.setItem("redirectDoctorId", slot.doctorId);
        localStorage.setItem(
          "redirectSlot",
          JSON.stringify({ start: slot.start, end: slot.end })
        );
      }
      router.push("/login");
    }
  }, [selectedDoctor, slot, router]);

  useEffect(() => {
    const s = localStorage.getItem("selectedSlot");
    if (!s) return;
    const parsed = JSON.parse(s);
    setSlot(parsed);
    setSelectedDoctor(parsed.doctorId);

    const d = new Date(parsed.start);
    setDate(d.toISOString().split("T")[0]);
    const hh = d.getUTCHours().toString().padStart(2, "0");
    const mm = d.getUTCMinutes().toString().padStart(2, "0");
    setTime(`${hh}:${mm}`);
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API}/api/doctors`);
      const data: Doctor[] = await res.json();
      setDoctors(data);
      if (!doctorIdFromUrl && data.length > 0 && !slot) {
        setSelectedDoctor(data[0]._id);
      }
    } catch {
      showToast("Failed to load doctors", "error");
    }
  };

  useEffect(() => {
    if (doctorIdFromUrl) {
      const cleanId = doctorIdFromUrl.split("?")[0];
      setSelectedDoctor(cleanId);
    } else {
      fetchDoctors();
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!patientName || !selectedDoctor || !date || !time) {
      showToast("Please fill all fields", "error");
      return;
    }

    let startTime: Date;
    let endTime: Date;

    if (slot) {
      startTime = new Date(slot.start);
      endTime = new Date(slot.end);
    } else {
      startTime = new Date(`${date}T${time}:00`);
      endTime = new Date(startTime.getTime() + 30 * 60000);
    }

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      showToast("Invalid date or time", "error");
      return;
    }

    const doctorIdToUse = slot?.doctorId || selectedDoctor;
    const startISO = startTime.toISOString();

    try {
      const res = await fetch(`${API}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor: doctorIdToUse,
          patientName,
          patientEmail,
          start: startISO,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.message || "Failed to book appointment", "error");
        return;
      }

      localStorage.setItem(
        "appointmentConfirmation",
        JSON.stringify({
          patientName,
          doctorName:
            doctors.find((d) => d._id === doctorIdToUse)?.name || "Doctor",
          specialization: doctors.find((d) => d._id === doctorIdToUse)
            ?.specialization,
          dateTime: startISO,
        })
      );

      showToast("Appointment booked successfully!", "success");
      localStorage.removeItem("selectedSlot");
      router.push("/thank-you");
    } catch {
      showToast("Something went wrong", "error");
    }
  };

  return (
    <div className="container py-5 mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg rounded-5 border-0 p-5" style={{ backgroundColor: "#f9f9f9" }}>
            <h2 className="mb-4 text-center fw-bold" style={{ color: "#0d6efd" }}>
              Book an Appointment
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Your Name</label>
                <input
                  className="form-control form-control-lg shadow-sm border-1 rounded-3"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Email</label>
                <input
                  className="form-control form-control-lg shadow-sm border-1 rounded-3"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              {/* Doctor */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Select Doctor</label>
                <select
                  className="form-select form-select-lg shadow-sm border-1 rounded-3"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  disabled={!!slot || !!doctorIdFromUrl}
                >
                  {!slot && !doctorIdFromUrl && <option value="">Select a doctor</option>}
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.name} ({doc.specialization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Date</label>
                <input
                  type="date"
                  className="form-control form-control-lg shadow-sm border-1 rounded-3"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={!!slot}
                />
              </div>

              {/* Time */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Time</label>
                <input
                  type="time"
                  className="form-control form-control-lg shadow-sm border-1 rounded-3"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={!!slot}
                />
              </div>

              <button className="btn btn-primary btn-lg w-100 fw-bold shadow-sm" type="submit">
                {slot ? "Confirm Appointment" : "Book Appointment"}
              </button>
            </form>

            {slot && (
              <p className="mt-4 text-center fw-semibold text-success">
                Selected slot:{" "}
                <span className="fw-normal">
                  {new Date(slot.start).toLocaleString()} – {new Date(slot.end).toLocaleTimeString()}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}