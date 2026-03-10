"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { showToast } from "@/utils/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  image: string;
  experience?: string;
  education?: string;
  certifications?: string;
  languages?: string;
  hospital?: string;
}

interface AvailabilityRule {
  type?: "date" | "weekly";
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
  date?: string;
}

export default function AddDoctorPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(false);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [duration, setDuration] = useState(30);
  const [selectedDate, setSelectedDate] = useState("");
  const [availability, setAvailability] = useState<AvailabilityRule[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    email: "",
    phone: "",
    experience: "",
    education: "",
    certifications: "",
    languages: "",
    hospital: "",
    image: null as File | null,
  });

  // ================= TIME OPTIONS =================

  const generateTimeOptions = () => {
    const times: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        const period = h < 12 ? "AM" : "PM";
        const minStr = m.toString().padStart(2, "0");
        const label = `${hour12}:${minStr} ${period}`;
        const value = `${h.toString().padStart(2, "0")}:${minStr}`;
        times.push({ value, label });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // ================= FETCH =================

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_URL}/api/doctors`);

      let data;

      try {
        data = await res.json();
      } catch {
        const text = await res.text();
        console.error("Server returned HTML:", text);
        throw new Error("Server error");
      }

      if (Array.isArray(data)) {
        setDoctors(data);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error("Fetch doctors error:", error);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // ================= IMAGE =================

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, image: file }));

    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ================= ADD AVAILABILITY =================

  const addAvailabilityRule = () => {
    if (!from || !to || !selectedDate)
      return showToast("Select date/time", "error");

    const dayOfWeek = new Date(selectedDate).getDay();

    const newRule: AvailabilityRule = {
      type: "date",
      dayOfWeek,
      startTime: from,
      endTime: to,
      duration,
      date: selectedDate,
    };

    setAvailability((prev) => [...prev, newRule]);
    showToast("Availability added", "success");
  };

  const removeSlot = (index: number) => {
    setAvailability((prev) => prev.filter((_, i) => i !== index));
  };

  // ================= ADD =================

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (
        !formData.name ||
        !formData.specialization ||
        !formData.email ||
        !formData.phone
      ) {
        return showToast("Please fill all required fields", "error");
      }

      setLoading(true);

      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "image" && value) {
          payload.append("image", value as File);
        } else {
          payload.append(key, value as string);
        }
      });

      payload.append("availabilitySlots", JSON.stringify(availability));

      const res = await fetch(`${API_URL}/api/doctors`, {
        method: "POST",
        body: payload,
      });

      let data;

      try {
        data = await res.json();
      } catch {
        throw new Error("Server error");
      }

      if (!res.ok) {
        showToast(data.message || "Failed to add doctor", "error");
        return;
      }

      showToast("Doctor added successfully", "success");

      setFormData({
        name: "",
        specialization: "",
        email: "",
        phone: "",
        experience: "",
        education: "",
        certifications: "",
        languages: "",
        hospital: "",
        image: null,
      });

      setPreview(null);
      setAvailability([]);

      fetchDoctors();
    } catch (error) {
      console.error(error);
      showToast("Server error", "error");
    } finally {
      setLoading(false);
    }
  };
  // ================= UPDATE =================

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editDoctor) return;

    const target = e.currentTarget as any;

    const payload = new FormData();

    [
      "name",
      "specialization",
      "email",
      "phone",
      "experience",
      "education",
      "certifications",
      "languages",
      "hospital",
    ].forEach((key) => payload.append(key, target[key].value || ""));

    if (target.image?.files[0]) {
      payload.append("image", target.image.files[0]);
    }

    await fetch(`${API_URL}/api/doctors/${editDoctor._id}`, {
      method: "PUT",
      body: payload,
    });

    showToast("Doctor updated", "success");

    setEditDoctor(null);
    setPreview(null);
    fetchDoctors();
  };

  // ================= DELETE =================

  const deleteDoctor = async (id: string) => {
    await fetch(`${API_URL}/api/doctors/${id}`, { method: "DELETE" });
    fetchDoctors();
  };

  return (
    <>
      <div style={{ marginLeft: 100, padding: 60 }}>
        {/* HEADER */}
       <h3 className="fw-bold mb-4 text-primary text-center">Doctors Management</h3>

        {/* ADD CARD */}
        <div className="card shadow-sm border-0 mb-5">
          <div className="card-body p-4">
            <h5 className="fw-semibold mb-3">Add Doctor</h5>

            <form onSubmit={handleAdd}>
              <div className="row g-3">
                {Object.entries(formData)
                  .filter(([k]) => k !== "image")
                  .map(([key, value]) => (
                    <div key={key} className="col-md-6">
                      <label className="form-label text-capitalize fw-semibold">
                        {key}
                      </label>

                      <input
                        className="form-control shadow-sm"
                        placeholder={`Enter ${key}`}
                        value={value as string}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                <div className="col-md-6">
                  <input
                    type="file"
                    className="form-control"
                    onChange={handleImageChange}
                  />
                </div>

                {preview && (
                  <div className="col-md-6">
                    <img
                      src={preview}
                      width={90}
                      height={90}
                      className="rounded-circle border shadow-sm"
                    />
                  </div>
                )}
              </div>

              {/* AVAILABILITY */}
            <div className="mt-4 p-4 bg-light rounded border">
              <h6 className="fw-bold text-secondary mb-3">
  Doctor Availability
</h6>
                <div className="row g-2">
                  <div className="col-md-3">
                    <input
                      type="date"
                      className="form-control"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>

                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                    >
                      <option>From</option>
                      {timeOptions.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                    >
                      <option>To</option>
                      {timeOptions.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                    >
                      <option value={15}>15m</option>
                      <option value={30}>30m</option>
                      <option value={60}>60m</option>
                    </select>
                  </div>

                  <div className="col-md-1">
                    <button
                      type="button"
                      className="btn btn-success w-100"
                      onClick={addAvailabilityRule}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-3 d-flex flex-wrap gap-2">
                  {availability.map((s, i) => (
                    <div key={i} className="badge bg-primary p-2">
                      {s.date} {s.startTime}-{s.endTime}
                      <span
                        className="ms-2"
                        style={{ cursor: "pointer" }}
                        onClick={() => removeSlot(i)}
                      >
                        ❌
                      </span>
                    </div>
                  ))}
                </div>
              </div>

           <button className="btn btn-primary mt-4 px-4 py-2 shadow-sm">
                {loading ? "Saving..." : "Add Doctor"}
              </button>
            </form>
          </div>
        </div>

        {/* DOCTOR TABLE */}
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h5 className="fw-semibold mb-3">Doctors List</h5>

            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Specialization</th>
                  <th>Phone</th>
                  <th>Hospital</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {doctors.map((d) => (
                  <tr key={d._id}>
                    {/* Image */}
                    <td>
                     <img
  src={d.image}
  width={45}
  height={45}
  className="rounded-circle border shadow-sm"
/>
                    </td>

                    {/* Doctor Name */}
                    <td>{d.name}</td>

                    {/* Specialization */}
                    <td>{d.specialization}</td>

                    {/* Phone */}
                    <td>{d.phone}</td>

                    {/* Hospital */}
                    <td>{d.hospital || "-"}</td>

                    {/* Actions */}
                   <td className="text-center">
  <div className="d-flex justify-content-center gap-2">
    
    <button
      className="btn btn-sm btn-outline-warning"
      onClick={() => {
        setEditDoctor(d);
        setPreview(d.image);
      }}
    >
      Edit
    </button>

    <button
      className="btn btn-sm btn-outline-danger"
      onClick={() => deleteDoctor(d._id)}
    >
      Delete
    </button>

  </div>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}

      {editDoctor && (
        <div className="modal fade show d-block bg-dark bg-opacity-50">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleUpdate}>
                <div className="modal-header">
                  <h5>Edit Doctor</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditDoctor(null)}
                  />
                </div>

                <div className="modal-body">
                  {[
                    "name",
                    "specialization",
                    "email",
                    "phone",
                    "experience",
                    "education",
                    "certifications",
                    "languages",
                    "hospital",
                  ].map((key) => (
                    <input
                      key={key}
                      name={key}
                      defaultValue={(editDoctor as any)[key]}
                      className="form-control mb-2"
                    />
                  ))}

                  <input
                    type="file"
                    name="image"
                    className="form-control mb-2"
                    onChange={(e: any) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />

                  {preview && (
                    <img
                      src={preview}
                      width={80}
                      className="rounded-circle mt-2"
                    />
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditDoctor(null)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-success">Update</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
