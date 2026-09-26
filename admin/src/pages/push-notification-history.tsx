import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../utils/config";
import Title from "../extra/Title";
import Table from "../extra/Table";
import RootLayout from "@/component/layout/Layout";

const PushNotificationHistory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${baseURL}/admin/notification/history`);
        if (response.data.status) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch notification history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
  ];

  return (
    <div className="main-content">
      <Title name="Push Notification History" />
      <div className="page-content">
        <div className="card">
          <div className="card-body">
            <Table data={data} mapData={mapData} PerPage={10} Page={1} type="client" />
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
