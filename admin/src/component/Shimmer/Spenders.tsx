import React from "react";
import "../../assets/scss/Shimmer/Spenders.css";

const Spenders = () => {
  return (
    <>
      <thead>
        <tr style={{ height: "50px" }}>
          <th scope="col"></th>
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
              <td>
                <div className="skeleton skeleton-text" style={{ width: "20px" }} />
              </td>

              {/* Spender */}
              <td>
                <div className="d-flex px-2 py-1" style={{ width: "230px" }}>
                  <div>
                    <div
                      className="skeleton skeleton-circle"
                      style={{
                        height: "50px",
                        width: "50px",
                        borderRadius: "50px",
                      }}
                    />
                  </div>
                  <div
                    className="d-flex flex-column justify-content-center text-start ms-3"
                    style={{ width: "120px" }}
                  >
                    <div
                      className="skeleton skeleton-text"
                      style={{
                        height: "14px",
                        width: "100px",
                        marginBottom: "5px",
                      }}
                    />
                  </div>
                </div>
              </td>

              {/* Email */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "150px" }} />
              </td>

              {/* Country */}
              <td style={{paddingRight : "150px"}}>
                <div className="d-flex justify-content-end align-items-center gap-3">
                  <div style={{ width: "70px", textAlign: "end" }}>
                    <div
                      className="skeleton skeleton-circle"
                      style={{
                        height: "40px",
                        width: "40px",
                        borderRadius: "50%",
                      }}
                    />
                  </div>
                  <div style={{ width: "100px", textAlign: "start" }}>
                    <div className="skeleton skeleton-text" style={{ width: "70px" }} />
                  </div>
                </div>
              </td>

              {/* Is VIP */}
              <td style={{paddingRight : "80px"}}>
                <div className="skeleton skeleton-text" style={{ width: "30px" }} />
              </td>

              {/* Total Coin Spend */}
              <td style={{paddingRight : "20px"}}>
                <div className="skeleton skeleton-text" style={{ width: "60px" }} />
              </td>
            </tr>
          ))}
      </tbody>
    </>
  );
};

export default Spenders;
