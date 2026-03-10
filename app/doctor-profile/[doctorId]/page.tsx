
"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useParams, useRouter } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface Slot {
  start: Date;
  end: Date;
  duration?: number;
  type?: "weekly" | "daily" | "monthly" | "date";
}

interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone: string | number;
  specialization: string;
  image: string;
  experience?: string;
  education?: string;
  certifications?: string;
  languages?: string;
  hospital?: string;
  rating?: number;
  availabilitySlots: Slot[];
}

interface Appointment {
  start: string;
  end: string;
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function DoctorProfilePage() {
  const { doctorId } = useParams();
  const router = useRouter();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlotStart, setSelectedSlotStart] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slotsByDate, setSlotsByDate] = useState<Record<string, Slot[]>>({});

  useEffect(() => {
    if (!doctorId) return;
    fetchDoctor();
    fetchAppointments();
    fetchReviews();
  }, [doctorId]);

  useEffect(() => {
    if (doctor) fetchAvailableSlots();
  }, [doctor, currentMonth]);

  const fetchDoctor = async () => {
    const res = await fetch(`${BASE_URL}/api/doctors/${doctorId}`);
    const data = await res.json();
    setDoctor(data);
  };

  const fetchAppointments = async () => {
    const res = await fetch(`${BASE_URL}/api/appointments/doctor/${doctorId}`);
    const data = await res.json();
    setAppointments(data);
  };

  const fetchReviews = async () => {
    const res = await fetch(`${BASE_URL}/api/reviews/${doctorId}`);
    const data = await res.json();
    setReviews(data);
  };

  const getDateKey = (date: Date | string) => {
    if (typeof date === "string") return date.split("T")[0];
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;
  };

  const getMonthYearLabel = () =>
    currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return {
      firstDay: new Date(year, month, 1).getDay(),
      daysInMonth: new Date(year, month + 1, 0).getDate(),
    };
  };

  const changeMonth = (dir: "prev" | "next") => {
    setSelectedDate(null);
    setSelectedSlotStart(null);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + (dir === "next" ? 1 : -1), 1));
  };

  const groupSlotsByDate = (slots: Slot[]) => {
    const map: Record<string, Slot[]> = {};
    slots.forEach((slot) => {
      const key = getDateKey(slot.start);
      if (!map[key]) map[key] = [];
      map[key].push(slot);
    });
    return map;
  };

  const getSlotsForDate = (date: Date) => {
    const key = getDateKey(date);
    return slotsByDate[key] || [];
  };

  const isBooked = (slot: Slot) =>
    appointments.some((a) => {
      const slotStart = slot.start.getTime();
      const slotEnd = slot.end.getTime();
      const appStart = new Date(a.start).getTime();
      const appEnd = new Date(a.end).getTime();
      return slotStart < appEnd && slotEnd > appStart;
    });

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedSlotStart) {
      alert("Please select a time slot");
      return;
    }
    const slot = getSlotsForDate(selectedDate).find((s) => s.start.getTime() === selectedSlotStart.getTime());
    if (!slot) return;
    localStorage.setItem("selectedSlot", JSON.stringify({ doctorId, start: slot.start, end: slot.end }));
    router.push(`/book-appointment?doctorId=${doctorId}`);
  };

  const fetchAvailableSlots = async () => {
    if (!doctor) return;

    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const res = await fetch(`${BASE_URL}/api/appointments/${doctor._id}/availability?from=${monthStart.toISOString()}&to=${monthEnd.toISOString()}`);
    const data: Slot[] = await res.json();

    const slotsWithDates = data.map((slot) => ({
      ...slot,
      start: new Date(slot.start),
      end: new Date(slot.end),
    }));

    setSlotsByDate(groupSlotsByDate(slotsWithDates));

    if (!selectedDate && Object.keys(slotsWithDates).length > 0) {
      const firstKey = Object.keys(groupSlotsByDate(slotsWithDates))[0];
      if (firstKey) {
        const [y, m, d] = firstKey.split("-").map(Number);
        setSelectedDate(new Date(y, m - 1, d));
      }
    }
  };

  if (!doctor) {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh", marginTop: 50 }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: 60, height: 60 }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading doctor details...</p>
      </div>
    </div>
  );
}

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="container py-4 flex-grow-1">

        {/* Doctor Info */}
        <div className="card shadow-sm p-4 mb-4 mt-5">
          <div className="row align-items-center">
            <div className="col-md-3 text-center">
              <img src={doctor.image} className="rounded-circle" style={{ width: 150, height: 150, objectFit: "cover" }} alt={doctor.name} />
            </div>
            <div className="col-md-9">
              <h3>{doctor.name}</h3>
              <p className="text-primary">{doctor.specialization}</p>
              <div className="d-flex align-items-center mb-2">
                {avgRating && (
                  <>
                    <span className="me-2 fw-bold">{avgRating}</span>
                    <span className="text-warning">
                      {"★".repeat(Math.round(Number(avgRating)))}
                      {"☆".repeat(5 - Math.round(Number(avgRating)))}
                    </span>
                    <span className="ms-2 text-muted">({reviews.length} reviews)</span>
                  </>
                )}
              </div>
              <p className="mb-1"><b>Hospital:</b> {doctor.hospital || "-"}</p>
              <p className="mb-1"><b>Experience:</b> {doctor.experience || "-"}</p>
              <p className="mb-1"><b>Languages:</b> {doctor.languages || "-"}</p>
            </div>
          </div>
        </div>

        {/* Calendar + Slots */}
        <div className="card shadow-sm p-4 mb-4">
          <h4 className="mb-3 text-center">Book Your Appointment</h4>
          <div className="row">
            {/* Calendar */}
            <div className="col-md-6 border-end pe-3 text-center mb-3 mb-md-0">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <button className="btn btn-outline-primary btn-sm" onClick={() => changeMonth("prev")}>◀</button>
                <span className="fw-bold">{getMonthYearLabel()}</span>
                <button className="btn btn-outline-primary btn-sm" onClick={() => changeMonth("next")}>▶</button>
              </div>
              <div className="d-grid" style={{ gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="text-center fw-bold">{d}</div>)}
                {Array.from({ length: getDaysInMonth().firstDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: getDaysInMonth().daysInMonth }).map((_, i) => {
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
                  const key = getDateKey(date);
                  const hasSlots = !!slotsByDate[key];
                  return (
                    <button
                      key={i}
                      className={`btn btn-sm d-flex flex-column align-items-center rounded-pill ${selectedDate?.toDateString() === date.toDateString() ? "btn-primary text-white" : hasSlots ? "btn-outline-primary" : "btn-light text-muted"}`}
                      disabled={!hasSlots}
                      onClick={() => { setSelectedDate(date); setSelectedSlotStart(null); }}
                    >
                      <small className="text-muted">{date.toLocaleDateString("en-US",{ weekday:"short" })}</small>
                      <span>{i+1}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time Slots */}
            <div className="col-md-6 ps-3">
              <h6>Select Time</h6>
              <div className="d-flex flex-wrap gap-2">
                {selectedDate && getSlotsForDate(selectedDate).map((slot, i) => {
                  const booked = isBooked(slot);
                  const isSelected = selectedSlotStart?.getTime() === slot.start.getTime();
                  return (
                    <button
                      key={i}
                      disabled={booked}
                      className={`btn rounded-pill ${booked ? "btn-danger text-white" : isSelected ? "btn-primary" : "btn-outline-primary"}`}
                      onClick={() => setSelectedSlotStart(slot.start)}
                    >
                      {slot.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{booked && " (Booked)"}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <button className="btn btn-primary px-4 py-2" onClick={handleBookAppointment}>Book Appointment</button>
          </div>
        </div>

      
      </main>
    </div>
  )
}

