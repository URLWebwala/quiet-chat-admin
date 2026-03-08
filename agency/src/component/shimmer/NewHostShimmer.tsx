import React from "react";
import "../../assets/shimmer/NewHostShimmer.css";

const NewHostShimmer = () => {
  return (
    <>
      {/* Header row placeholder */}
      <thead>
        <tr style={{ height: "50px" }}>
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <th key={i}></th>
            ))}
        </tr>
      </thead>

      <tbody>
        {Array(8) // 8 shimmer rows
          .fill(0)
          .map((_, rowIdx) => (
            <tr key={rowIdx} style={{ height: "60px" }}>
              
              {/* No */}
              <td style={{ textAlign: "center", width: "50px" }}>
                <div className="skeleton skeleton-text" style={{ width: "20px" }}></div>
              </td>

              {/* Unique Id */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
              </td>

              {/* User (image + name) */}
              <td>
                <div className="d-flex align-items-center gap-3">
                  <div className="skeleton skeleton-avatar" style={{ width: "50px", height: "50px", borderRadius: "50%" }}></div>
                  <div>
                    <div className="skeleton skeleton-text" style={{ width: "120px" }}></div>
                  </div>
                </div>
              </td>

              {/* Country (flag + name) */}
              <td>
                <div className="d-flex align-items-center gap-3">
                  <div className="skeleton skeleton-avatar" style={{ width: "40px", height: "40px", borderRadius: "50%" }}></div>
                  <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
                </div>
              </td>

              {/* Coin */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "50px" }}></div>
              </td>

              {/* Is Block */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "40px" }}></div>
              </td>

              {/* Is Online */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "40px" }}></div>
              </td>

              {/* Date */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "90px" }}></div>
              </td>

            </tr>
          ))}
      </tbody>
    </>
  );
};

export default NewHostShimmer;
