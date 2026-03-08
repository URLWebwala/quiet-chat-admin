import React from "react";
import "../../assets/scss/Shimmer/impressionShimmer.css";

const ImpressionShimmer = () => {
  return (
    <>
      <thead>
        <tr style={{ height: "50px" }}>
          <th scope="col"></th>
          <th scope="col"></th>
          <th scope="col"></th>
          <th scope="col"></th>
          <th scope="col"></th>
        </tr>
      </thead>
      <tbody>
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <tr key={i} style={{ height: "60px" }}>
              {/* No */}
              <td style={{ paddingLeft: "25px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "20px", height: "12px" }}
                ></div>
              </td>

              {/* Title */}
              <td style={{ paddingLeft: "100px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "150px", height: "14px" }}
                ></div>
              </td>

              {/* Date 1 */}
              <td style={{ paddingRight: "100px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "100px", height: "12px" }}
                ></div>
              </td>

              {/* Date 2 */}
              <td style={{ paddingRight: "100px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "100px", height: "12px" }}
                ></div>
              </td>

              {/* Edit icon */}
              <td>
                <div
                  className="skeleton skeleton-icon"
                  style={{ width: "28px", height: "28px", borderRadius: "8px" }}
                ></div>
              </td>

              {/* Delete icon */}
              <td>
                <div
                  className="skeleton skeleton-icon"
                  style={{ width: "28px", height: "28px", borderRadius: "8px" }}
                ></div>
              </td>
            </tr>
          ))}
      </tbody>
    </>
  );
};

export default ImpressionShimmer;
