import React from "react";
import "../../assets/shimmer/AgencyEarningHistoryShimmer.css";

const AgencyEarningHistoryShimmer = () => {
  return (
    <>
      {/* Table header shimmer */}
      <thead>
        <tr style={{ height: "50px" }}>
          {Array(10)
            .fill(0)
            .map((_, idx) => (
              <th key={idx}></th>
            ))}
        </tr>
      </thead>

      <tbody>
        {Array(8) // 8 shimmer rows
          .fill(0)
          .map((_, rowIdx) => (
            <tr key={rowIdx} style={{ height: "60px" }}>
              
              {/* No */}
              <td style={{ textAlign: "center" }}>
                <div className="skeleton skeleton-text" style={{ width: "20px" }}></div>
              </td>

              {/* UniqueId */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
              </td>

              {/* Sender Name */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "120px" }}></div>
              </td>

              {/* Receiver Name */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "120px" }}></div>
              </td>

              {/* Description */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "140px" }}></div>
              </td>

              {/* User Coin */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "60px" }}></div>
              </td>

              {/* Host Coin */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "60px" }}></div>
              </td>

              {/* Admin Coin */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "60px" }}></div>
              </td>

              {/* Agency Coin */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "70px" }}></div>
              </td>

              {/* Date */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
              </td>

            </tr>
          ))}
      </tbody>
    </>
  );
};

export default AgencyEarningHistoryShimmer;
