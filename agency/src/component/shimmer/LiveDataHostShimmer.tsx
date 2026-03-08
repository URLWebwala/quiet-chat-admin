import React from "react";
import "../../assets/shimmer/LiveDataHostShimmer.css";

const LiveDataHostShimmer = () => {
  return (
    <>
      {/* Table header skeleton */}
      <thead>
        <tr style={{ height: "50px" }}>
          {Array(5).fill(0).map((_, idx) => (
            <th key={idx} scope="col"></th>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array(8).fill(0).map((_, rowIdx) => (
          <tr key={rowIdx} style={{ height: "70px" }}>
            
            {/* No */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-text" style={{ width: "25px" }}></div>
            </td>

            {/* Host (image + name) */}
            <td>
              <div className="d-flex align-items-center gap-2 justify-content-start" style={{ paddingLeft: "10px" }}>
                <div className="skeleton skeleton-circle" style={{ width: "50px", height: "50px" }}></div>
                <div>
                  <div className="skeleton skeleton-text" style={{ width: "120px", marginBottom: "6px" }}></div>
                </div>
              </div>
            </td>

            {/* Country (flag + name) */}
            <td>
              <div className="d-flex align-items-center gap-2">
                {/* Flag */}
                <div className="skeleton skeleton-flag" style={{ width: "40px", height: "40px", borderRadius: "50%" }}></div>
                {/* Country name */}
                <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
              </div>
            </td>

            {/* View count */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-text" style={{ width: "40px" }}></div>
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

export default LiveDataHostShimmer;
