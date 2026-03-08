import React from "react";
import "../../assets/shimmer/CoinPlanShimmer.css";

const CoinPlanShimmer = () => {
  return (
    <>
      {/* Table header shimmer */}
      <thead>
        <tr style={{ height: "50px" }}>
          {Array(6).fill(0).map((_, idx) => (
            <th key={idx} scope="col"></th>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array(8).fill(0).map((_, rowIdx) => (
          <tr key={rowIdx} style={{ height: "80px" }}>
            
            {/* No */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-text" style={{ width: "25px" }}></div>
            </td>

            {/* Image */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-rect" style={{ width: "50px", height: "50px", borderRadius: "50%" }}></div>
            </td>

            {/* Name */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "120px" }}></div>
            </td>

            {/* Details (multiple lines) */}
            <td>
              <div className="d-flex flex-column gap-1">
                <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
                <div className="skeleton skeleton-text" style={{ width: "80px" }}></div>
                {/* <div className="skeleton skeleton-text" style={{ width: "90px" }}></div> */}
              </div>
            </td>

            {/* Is Active */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-text" style={{ width: "50px" }}></div>
            </td>

            {/* Created At */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "140px" }}></div>
            </td>

          </tr>
        ))}
      </tbody>
    </>
  );
};

export default CoinPlanShimmer;
