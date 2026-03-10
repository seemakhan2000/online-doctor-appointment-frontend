"use client";

import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { useRouter } from "next/navigation";
import { showToast } from "../../../utils/toast";
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
  reviews?: Review[];
}

export default function SkinCareDoctorsPage() {

  const router = useRouter();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchSkinDoctors();
  }, []);

  async function fetchSkinDoctors() {
    try {

      const res = await fetch(`${BASE_URL}/api/doctors`);
      const data = await res.json();

      const skinDoctors = data.filter((doc: Doctor) =>
        doc.specialization?.toLowerCase().includes("skin")
      );

      setDoctors(skinDoctors);

    } catch (error) {
      console.error("Error fetching skin care doctors:", error);
    }
  }

  const fetchDoctorReviews = async (doctorId: string) => {

    try {

      const res = await fetch(`${BASE_URL}/api/reviews/${doctorId}`);
      const data = await res.json();

      setSelectedDoctor(prev =>
        prev ? { ...prev, reviews: data } : null
      );

    } catch (err) {
      console.error("Failed to fetch reviews:", err);
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

  return (
    <>
      <Navbar />

      <main className="container mt-5 pt-5">

        <h2 className="mb-5 text-center fw-bold text-primary">
          Skin Care Doctors
        </h2>

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
                          Math.round(getAverageRating(doctor.reviews))
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
                    </div>

                  </div>

                </div>

              </div>

            ))

          ) : (

            <div className="col-12 text-center">
              <p className="text-muted">No skin care doctors found.</p>
            </div>

          )}

        </div>
      </main>
    </>
  );
}