import React, { useEffect, useState } from "react";
import { apiInstanceFetch } from "../utils/ApiInstance";
import { baseURL } from "../utils/config";
import Title from "../extra/Title";
import Table from "../extra/Table";
import RootLayout from "@/component/layout/Layout";
import Analytics from "@/extra/Analytic";
import { allUserHostNotification } from "@/store/notificationSlice";
import { useAppDispatch } from "@/store/store";

const PushNotificationHistory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiInstanceFetch.get(`api/admin/notification/history`);
        if (response.status) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch notification history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleResend = (row: any) => {
    const payload = {
      title: row.title,
      message: row.message,
      notificationType: row.notificationType,
      image: row.image,
    };
    dispatch(allUserHostNotification(payload)).unwrap();
  };

  const filteredData = data.filter((item: any) => {
    // Status filter
    if (statusFilter === "Opened" && item.totalOpened === 0) return false;
    if (statusFilter === "Not Opened" && (item.totalOpened > 0 || item.totalDelivered === 0)) return false;
    if (statusFilter === "Not Delivered" && item.totalDelivered > 0) return false;

    // Date filter
    if (startDate !== "All" && endDate !== "All") {
      const itemDate = new Date(item.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (itemDate < start || itemDate > end) return false;
    }

    return true;
  });

  const mapData = [
    {
      Header: "No.",
      Cell: ({ index }: { index: number }) => <span>{index + 1}</span>,
    },
    {
      Header: "Image",
      Cell: ({ row }: { row: any }) =>
        row.image ? (
          <img src={baseURL + "/" + row.image} alt="Notification" width="50" height="50" style={{ borderRadius: "5px", objectFit: "cover" }} />
        ) : (
          <span>No Image</span>
        ),
    },
    {
      Header: "Title",
      body: "title",
    },
    {
      Header: "Message",
      body: "message",
    },
    {
      Header: "Sent To",
      Cell: ({ row }: { row: any }) => <span>{row.notificationType || "N/A"}</span>,
    },
    {
      Header: "Total Sent",
      body: "totalSent",
    },
    {
      Header: "Delivered",
      body: "totalDelivered",
    },
    {
      Header: "Opened",
      body: "totalOpened",
    },
    {
      Header: "Date",
      body: "date",
    },
    {
      Header: "Action",
      Cell: ({ row }: { row: any }) => (
        <button
          className="btn text-white"
          onClick={() => handleResend(row)}
          style={{ padding: "5px 15px", fontSize: "14px", borderRadius: "5px", backgroundColor: "#E96479", border: "none" }}
        >
          Resend
        </button>
      ),
    },
  ];

  return (
    <div className="main-content">
      <Title name="Push Notification History" />
      <div className="page-content">
        <div className="row d-flex align-items-center mb-3">
          <div className="col-10 d-flex gap-2">
            <button
              className={`pendingRequest ${statusFilter === "All" ? "status-active-pending" : ""}`}
              onClick={() => setStatusFilter("All")}
            >
              All
            </button>
            <button
              className={`pendingRequest ${statusFilter === "Opened" ? "status-active-pending" : ""}`}
              onClick={() => setStatusFilter("Opened")}
            >
              Opened
            </button>
            <button
              className={`pendingRequest ${statusFilter === "Not Opened" ? "status-active-pending" : ""}`}
              onClick={() => setStatusFilter("Not Opened")}
            >
              Not Opened
            </button>
            <button
              className={`pendingRequest ${statusFilter === "Not Delivered" ? "status-active-pending" : ""}`}
              onClick={() => setStatusFilter("Not Delivered")}
            >
              Not Delivered
            </button>
          </div>
          <div className="col-2">
            <Analytics
              analyticsStartDate={startDate}
              analyticsStartEnd={endDate}
              analyticsStartDateSet={setStartDate}
              analyticsStartEndSet={setEndDate}
              direction={"start"}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <Table data={filteredData} mapData={mapData} PerPage={10} Page={1} type="client" />
          </div>
        </div>
      </div>
    </div>
  );
};

PushNotificationHistory.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default PushNotificationHistory;
