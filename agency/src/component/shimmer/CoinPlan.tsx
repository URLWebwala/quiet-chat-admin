import React from "react";
import "../../assets/shimmer/CoinPlan.css";

const CoinPlan = () => {
  return (
    <>
      {/* Table Header Placeholder */}
      <thead>
        <tr style={{ height: "45px" }}>
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <th key={i}></th>
            ))}
        </tr>
      </thead>

      {/* Table Body Placeholder */}
      <tbody>
        {Array(8) // show 8 shimmer rows
          .fill(0)
          .map((_, rowIdx) => (
            <tr key={rowIdx} style={{ height: "50px" }}>
              {/* No */}
              <td style={{ textAlign: "center", width: "40px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "20px" }}
                ></div>
              </td>

              {/* Unique Id */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "100px" }}
                ></div>
              </td>

              {/* Sender Name */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "120px" }}
                ></div>
              </td>

              {/* Description */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "150px" }}
                ></div>
              </td>

              {/* User Coin */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "60px" }}
                ></div>
              </td>

              {/* Host Coin */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "60px" }}
                ></div>
              </td>

              {/* Admin Coin */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "60px" }}
                ></div>
              </td>

              {/* Date */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "90px" }}
                ></div>
              </td>

              {/* Date */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "90px" }}
                ></div>
              </td>

              {/* Date */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "90px" }}
                ></div>
              </td>
            </tr>
          ))}
      </tbody>
    </>
  );
};

export default CoinPlan;
