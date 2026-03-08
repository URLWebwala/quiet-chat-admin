import React from "react";
import "../../assets/scss/Shimmer/FakeHostShimmer.css";

const FakeHostShimmer = () => {
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
            <tr key={i} style={{ height: "80px" }}>
              {/* No */}
              <td style={{ paddingLeft: "25px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "20px" }}
                ></div>
              </td>

              {/* User ID */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "60px" }}
                ></div>
              </td>

              {/* Avatar + Name */}
              <td >
                <div
                  className="d-flex align-items-center gap-2"
                  style={{ width: "180px" }}
                >
                  <div
                    className="skeleton skeleton-circle"
                    style={{ width: "40px", height: "40px" }}
                  ></div>
                  <div>
                    <div
                      className="skeleton skeleton-text"
                      style={{
                        width: "100px",
                        height: "14px",
                        marginBottom: "4px",
                      }}
                    ></div>
                  </div>
                </div>
              </td>

              {/* Video Preview (square thumbnail) */}
              <td style={{ paddingRight: "80px" }}>
                <div
                  className="skeleton"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "10px",
                  }}
                ></div>
              </td>

              {/* Email */}
              <td style={{ paddingRight: "50px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "140px" }}
                ></div>
              </td>

              {/* Gender */}
              <td style={{ paddingRight: "40px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "50px" }}
                ></div>
              </td>

              {/* Bio + Read more */}
              <td>
                <div
                  className="d-flex flex-column gap-1"
                  style={{ width: "200px" }}
                >
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "100%", height: "12px" }}
                  ></div>
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "80px", height: "12px" }}
                  ></div>
                </div>
              </td>

              {/* IsHost */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "30px" }}
                ></div>
              </td>

              {/* Created At */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "100px" }}
                ></div>
              </td>

              {/* Toggle */}
              <td>
                <div
                  className="skeleton skeleton-pill"
                  style={{ width: "50px", height: "25px" }}
                ></div>
              </td>

              {/* Info button */}
              <td>
                <div
                  className="skeleton skeleton-icon"
                  style={{ width: "28px", height: "28px" }}
                ></div>
              </td>

              {/* Edit button */}
              <td>
                <div
                  className="skeleton skeleton-icon"
                  style={{ width: "28px", height: "28px" }}
                ></div>
              </td>

              {/* Delete button */}
              <td>
                <div
                  className="skeleton skeleton-icon"
                  style={{ width: "28px", height: "28px" }}
                ></div>
              </td>
            </tr>
          ))}
      </tbody>
    </>
  );
};

export default FakeHostShimmer;
