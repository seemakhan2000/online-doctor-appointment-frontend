"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { showToast } from "../../utils/toast";
import Image from "next/image";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface Review {
  user?: { name: string };
  rating: number;
  comment: string;
  createdAt?: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  image: string;
  verified?: boolean;
  reviews?: Review[];
}

export default function DoctorsHomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openReviewId = searchParams.get("openReview");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [query, setQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!openReviewId || doctors.length === 0) return;
    const doctor = doctors.find((d) => d._id === openReviewId);
    if (doctor) {
      const token = localStorage.getItem("token");
      if (!token) {
        localStorage.setItem("redirectAction", "review");
        localStorage.setItem("redirectDoctorId", doctor._id);
        router.push("/login");
        return;
      }
      setSelectedDoctor(doctor);
      fetchDoctorReviews(doctor._id);
      const url = new URL(window.location.href);
      url.searchParams.delete("openReview");
      window.history.replaceState({}, "", url.toString());
    }
  }, [openReviewId, doctors]);

  async function fetchDoctors() {
    try {
      const res = await fetch(`${BASE_URL}/api/doctors`);
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  }

  const fetchDoctorReviews = async (doctorId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/reviews/${doctorId}`);
      const data = await res.json();
      setSelectedDoctor((prev) => (prev ? { ...prev, reviews: data } : null));
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  };

  const handleSearch = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/doctors/search?q=${query}`);
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const submitReview = async () => {
    if (!selectedDoctor) return;
    const token = localStorage.getItem("token");
    if (!token) {
      localStorage.setItem("redirectAction", "review");
      localStorage.setItem("redirectDoctorId", selectedDoctor._id);
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor: selectedDoctor._id,
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.setItem("redirectAction", "review");
        localStorage.setItem("redirectDoctorId", selectedDoctor._id);
        router.push("/login");
        return;
      }

      if (!res.ok) throw new Error("Failed to submit review");
      setNewReview({ rating: 0, comment: "" });
      fetchDoctorReviews(selectedDoctor._id);
      fetchDoctors();
      showToast("Review submitted successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to submit review. Please try again.");
    }
  };

  const getAverageRating = (reviews?: Review[]) => {
    if (!reviews || reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className="text-warning">
        {i < rating ? "★" : "☆"}
      </span>
    ));
  };

  const specialties = [
    { name: "Cardiology", icon: "❤️" },
    { name: "Mental Health", icon: "🧠" },
    { name: "Neurology", icon: "🧬" },
    { name: "Skin Care", icon: "🧴" },
    { name: "Pediatrics", icon: "👶" },
    { name: "Orthopedics", icon: "🦴" },
  ];

  return (
    <>
      <main>
        {/* HERO */}
        <section
          className="text-white py-5"
          style={{ background: "linear-gradient(135deg,#4f46e5,#3b82f6)" }}
        >
          <div className="container text-center">
            <h1 className="display-4 fw-bold mb-3">
              Book Appointments with Top Doctors
            </h1>

            <p className="lead mb-4">
              Search by specialty, doctor name, or condition
            </p>

            <div
              className="mx-auto shadow bg-white rounded-4 p-2"
              style={{ maxWidth: "600px" }}
            >
              <div className="input-group">
                <input
                  className="form-control border-0"
                  placeholder="Search doctor or specialty"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />

                <button
                  className="btn btn-primary d-flex align-items-center gap-2"
                  onClick={handleSearch}
                >
                  <Search size={18} />
                  <span className="d-none d-md-inline">Search</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SPECIALTIES */}
        <section className="py-5 bg-light">
          <div className="container">
            <h2 className="text-center fw-bold mb-5">Popular Specialties</h2>

            <div className="row g-4 justify-content-center">
              {specialties.map((s) => (
                <div key={s.name} className="col-xl-2 col-lg-3 col-md-4 col-6">
                  <div className="card text-center shadow-sm border-0 h-100 rounded-4 p-4">
                    <div className="fs-1 mb-3">{s.icon}</div>

                    <h6 className="fw-semibold">{s.name}</h6>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DOCTORS */}
        <section className="py-5">
          <div className="container">
            <h2 className="text-center fw-bold mb-5">Top Rated Doctors</h2>

            <div className="row g-4">
              {doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <div key={doctor._id} className="col-xl-4 col-md-6 col-sm-12">
                    <div className="card h-100 shadow-sm border-0 rounded-4">
                      <div className="card-body text-center d-flex flex-column">
                        <Image
                          src={doctor.image}
                          alt={doctor.name}
                          width={110}
                          height={110}
                          className="rounded-circle mx-auto mb-3 border"
                          style={{ objectFit: "cover" }}
                        />

                        <h5 className="fw-bold mb-1">{doctor.name}</h5>

                        <p className="text-muted mb-2">
                          {doctor.specialization}
                        </p>

                        {doctor.reviews && doctor.reviews.length > 0 ? (
                          <div className="mb-2">
                            {renderStars(
                              Math.round(getAverageRating(doctor.reviews)),
                            )}

                            <div className="small text-muted">
                              {doctor.reviews.length} reviews
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted small">No reviews yet</p>
                        )}

                        <p className="small text-muted">{doctor.email}</p>

                        <p className="small text-muted mb-3">{doctor.phone}</p>

                        <div className="mt-auto d-grid gap-2">
                          <a
                            href={`/doctor-profile/${doctor._id}`}
                            className="btn btn-outline-primary rounded-pill"
                          >
                            View Profile
                          </a>

                          <button
                            className="btn btn-primary rounded-pill"
                            onClick={() => {
                              const token = localStorage.getItem("token");

                              if (!token) {
                                router.push("/login");
                                return;
                              }

                              setSelectedDoctor(doctor);
                              fetchDoctorReviews(doctor._id);
                            }}
                          >
                            Reviews
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center">
                  <p className="text-muted">No doctors found</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* REVIEW MODAL */}
        {selectedDoctor && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setSelectedDoctor(null)}
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content rounded-4 border-0 shadow p-4">
                <div className="d-flex justify-content-between mb-3">
                  <h4>{selectedDoctor.name}</h4>

                  <button
                    className="btn-close"
                    onClick={() => setSelectedDoctor(null)}
                  />
                </div>

                <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                  {selectedDoctor.reviews?.map((review, i) => (
                    <div key={i} className="mb-3 border-bottom pb-2">
                      <strong>{review.user?.name || "Anonymous"}</strong>

                      <div className="text-warning">
                        {renderStars(review.rating)}
                      </div>

                      <p className="text-muted">{review.comment}</p>
                    </div>
                  ))}
                </div>

                <hr />

                <div className="mb-3 text-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      style={{ fontSize: "28px", cursor: "pointer" }}
                      className={
                        star <= (hoverRating || newReview.rating)
                          ? "text-warning"
                          : "text-secondary"
                      }
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() =>
                        setNewReview({ ...newReview, rating: star })
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>

                <textarea
                  className="form-control mb-3"
                  rows={3}
                  placeholder="Write your review..."
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview({
                      ...newReview,
                      comment: e.target.value,
                    })
                  }
                />

                <button
                  className="btn btn-primary w-100 rounded-pill"
                  onClick={submitReview}
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
