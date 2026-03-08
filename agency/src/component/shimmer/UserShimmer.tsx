import React from "react";
import "../../assets/shimmer/UserShimmer.css";

const UserShimmer = () => {
  return (
    <>
      {/* Header skeleton */}
      <thead>
        <tr style={{ height: "50px" }}>
          {Array(16).fill(0).map((_, idx) => (
            <th key={idx} scope="col"></th>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array(8).fill(0).map((_, rowIdx) => (
          <tr key={rowIdx} style={{ height: "80px" }}>

            {/* No */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-text" style={{ width: "20px" }}></div>
            </td>

            {/* Unique ID */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
            </td>

            {/* Host (image + name) */}
            <td>
              <div className="d-flex align-items-center gap-2" style={{ paddingLeft: "10px" }}>
                <div className="skeleton skeleton-circle" style={{ width: "50px", height: "50px" }}></div>
                <div>
                  <div className="skeleton skeleton-text" style={{ width: "120px", marginBottom: "6px" }}></div>
                </div>
              </div>
            </td>

            {/* Gender */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "60px" }}></div>
            </td>

            {/* Identity Proof Type */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "120px" }}></div>
            </td>

            {/* Impression (multi-line) */}
            <td>
              <div className="d-flex flex-column gap-1">
                <div className="skeleton skeleton-text" style={{ width: "160px" }}></div>
                <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
              </div>
            </td>

            {/* Coin */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "60px" }}></div>
            </td>

            {/* Is Online */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "40px" }}></div>
            </td>

            {/* Is Busy */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "40px" }}></div>
            </td>

            {/* Is Live */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "40px" }}></div>
            </td>

            {/* Created At */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "140px" }}></div>
            </td>

            {/* Is Block (Toggle Switch) */}
            <td>
              <div className="skeleton skeleton-pill" style={{ width: "50px", height: "24px", borderRadius: "20px" }}></div>
            </td>

            {/* Info Button */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-icon" style={{ width: "28px", height: "28px" }}></div>
            </td>

            {/* Notification Button */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-icon" style={{ width: "28px", height: "28px" }}></div>
            </td>

            {/* History Button */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-icon" style={{ width: "28px", height: "28px" }}></div>
            </td>

          </tr>
        ))}
      </tbody>
    </>
  );
};

export default UserShimmer;
