import React from "react";
import "../../assets/shimmer/AcceptedHostRequestShimmer.css";

const AcceptedHostRequestShimmer = () => {
  return (
    <>
      {/* Table Header Skeleton */}
      <thead>
        <tr style={{ height: "50px" }}>
          {Array(7).fill(0).map((_, idx) => (
            <th key={idx} scope="col"></th>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array(8).fill(0).map((_, i) => (
          <tr key={i} style={{ height: "80px" }}>
            
            {/* No Column */}
            <td style={{ paddingLeft: "25px", textAlign: "center" }}>
              <div className="skeleton skeleton-text" style={{ width: "20px" }}></div>
            </td>

            {/* Host Column (Image + Name) */}
            <td>
              <div className="d-flex align-items-center gap-2" style={{ paddingLeft: "20px" }}>
                <div className="skeleton skeleton-circle" style={{ width: "60px", height: "60px" }}></div>
                <div>
                  <div className="skeleton skeleton-text" style={{ width: "150px", marginBottom: "6px" }}></div>
                </div>
              </div>
            </td>

            {/* Impression Column (multi-line) */}
            <td>
              <div className="d-flex flex-column gap-1">
                <div className="skeleton skeleton-text" style={{ width: "180px" }}></div>
                <div className="skeleton skeleton-text" style={{ width: "120px" }}></div>
              </div>
            </td>

            {/* Document Type Column */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
            </td>

            {/* Country Column (flag + name) */}
            <td>
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton skeleton-circle" style={{ width: "40px", height: "40px" }}></div>
                <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
              </div>
            </td>

            {/* Created At Column */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "140px" }}></div>
            </td>

            {/* Info Button */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-icon" style={{ width: "28px", height: "28px" }}></div>
            </td>

          </tr>
        ))}
      </tbody>
    </>
  );
};

export default AcceptedHostRequestShimmer;
