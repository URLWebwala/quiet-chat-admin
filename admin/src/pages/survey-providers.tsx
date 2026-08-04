import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { baseURL } from "@/utils/config";
import { setToast } from "@/utils/toastServices";

export default function SurveyProviders() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);

  // Password Visibility Toggle State
  const [showSecretKey, setShowSecretKey] = useState<Record<string, boolean>>({});
  const [showServerKey, setShowServerKey] = useState<Record<string, boolean>>({});

  // Simulator State
  const [testUser, setTestUser] = useState("");
  const [testProvider, setTestProvider] = useState("bitlabs");
  const [testCoins, setTestCoins] = useState(250);
  const [testSimulating, setTestSimulating] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Mobile Emulator State
  const [userBalance, setUserBalance] = useState<number>(550);
  const [mobileTab, setMobileTab] = useState<"bitlabs" | "cpx">("bitlabs");
  const [mobileNav, setMobileNav] = useState<"offers" | "wallet" | "history">("offers");
  const [activeSurvey, setActiveSurvey] = useState<any | null>(null);
  const [surveyStep, setSurveyStep] = useState<number>(1);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [completedSuccess, setCompletedSuccess] = useState<boolean>(false);
  const [txHistory, setTxHistory] = useState<any[]>([
    { id: "tx_init", provider: "BitLabs", coins: 150, title: "Initial Welcome Reward", time: "10 mins ago" },
  ]);

  const sampleSurveys = {
    bitlabs: [
      { id: "bl_1", title: "Consumer Habits & Shopping 2026", duration: "4 mins", coins: 150, category: "Fast Survey", partner: "BitLabs Media" },
      { id: "bl_2", title: "Tech Gadgets & Smartphone Feedback", duration: "8 mins", coins: 300, category: "Featured", partner: "BitLabs Insights" },
      { id: "bl_3", title: "Streaming & Music Entertainment", duration: "3 mins", coins: 100, category: "Quick Rewards", partner: "BitLabs Demand" },
    ],
    cpx: [
      { id: "cpx_1", title: "Global Finance & Mobile Payment Study", duration: "5 mins", coins: 200, category: "High Paying", partner: "CPX Research Network" },
      { id: "cpx_2", title: "Food & Restaurant Dining Habits", duration: "7 mins", coins: 250, category: "Popular", partner: "CPX Opinion Panel" },
      { id: "cpx_3", title: "Travel & Vacation Preferences", duration: "3 mins", coins: 120, category: "Quick Survey", partner: "CPX Research" },
    ]
  };

  const surveyQuestions = [
    {
      q: "How frequently do you shop online for electronics or apps?",
      options: ["Daily", "2-3 times a week", "Once a month", "Rarely"]
    },
    {
      q: "Which device do you use most for daily video streaming?",
      options: ["Smartphone", "Smart TV / Laptop", "Tablet", "Console"]
    },
    {
      q: "Would you recommend quiet-chat reward system to your friends?",
      options: ["Definitely Yes! 🌟", "Most Likely", "Not Sure", "No"]
    }
  ];

  const [userSearchQuery, setUserSearchQuery] = useState("");

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await apiInstanceFetch.get("api/admin/reward/providers");
      if (res.status) {
        setProviders(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (search = "") => {
    try {
      const res = await apiInstanceFetch.get(`api/admin/user/retrieveUserList?start=1&limit=50&excludeHosts=false&search=${encodeURIComponent(search)}`);
      const list = res?.data || res?.user || [];
      if (res?.status && list.length > 0) {
        setUserList(list);
        if (!testUser) {
          setTestUser(list[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load users for simulator", err);
    }
  };

  const handleSearchChange = (q: string) => {
    setUserSearchQuery(q);
    fetchUsers(q);
  };

  const filteredUsers = userList.filter((u) => {
    if (!userSearchQuery) return true;
    const q = userSearchQuery.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(q);
    const emailMatch = u.email?.toLowerCase().includes(q);
    const idMatch = u._id?.toLowerCase().includes(q);
    const uniqueMatch = String(u.uniqueId || "").toLowerCase().includes(q);
    return nameMatch || emailMatch || idMatch || uniqueMatch;
  });

  useEffect(() => {
    fetchProviders();
    fetchUsers();
  }, []);

  const handleUpdate = async (id: string, body: any) => {
    try {
      const res = await apiInstanceFetch.patch(`api/admin/reward/provider/${id}`, body);
      if (res.status) {
        setToast("success", `${body.name || "Provider"} settings updated!`);
        fetchProviders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executeSurveyCompletion = async (providerName: string, coinsToCredit: number, surveyTitle: string, surveyId: string) => {
    if (!testUser) {
      setToast("error", "Please select a test user first!");
      return;
    }

    try {
      setIsCompleting(true);
      setTestSimulating(true);

      const res = await apiInstanceFetch.post("api/client/reward/survey/test-callback", {
        providerName,
        userId: testUser,
        coins: coinsToCredit,
      });

      if (res.status) {
        setTestResult(res);
        const newBal = res.result?.newBalance !== undefined ? res.result.newBalance : userBalance + coinsToCredit;
        setUserBalance(newBal);
        setCompletedSuccess(true);
        setTxHistory((prev) => [
          {
            id: `tx_${Date.now()}`,
            provider: providerName.toUpperCase(),
            coins: coinsToCredit,
            title: surveyTitle,
            time: "Just now",
          },
          ...prev,
        ]);
        setToast("success", `🎉 Survey Completed! +${coinsToCredit} coins credited!`);
      } else {
        setTestResult({ error: res.message || "Failed to execute callback" });
        setToast("error", res.message || "Callback simulation failed");
      }
    } catch (err: any) {
      setTestResult({ error: err.message || "Network error" });
      setToast("error", err.message || "Error simulating callback");
    } finally {
      setIsCompleting(false);
      setTestSimulating(false);
    }
  };

  const handleRunManualTest = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSurveyCompletion(testProvider, Number(testCoins), "Manual Webhook Simulator Test", "manual_sim");
  };

  const startSurveyModal = (srv: any) => {
    setActiveSurvey(srv);
    setSurveyStep(1);
    setSelectedOption("");
    setCompletedSuccess(false);
  };

  const handleNextStep = () => {
    if (surveyStep < 3) {
      setSurveyStep(surveyStep + 1);
      setSelectedOption("");
    } else {
      // Final Submit
      executeSurveyCompletion(mobileTab, activeSurvey.coins, activeSurvey.title, activeSurvey.id);
    }
  };

  const closeSurveyModal = () => {
    setActiveSurvey(null);
    setCompletedSuccess(false);
  };

  const selectedUserObj = userList.find((u) => u._id === testUser);

  return (
    <RootLayout>
      <div className="main-content">
        <Title title="Survey Provider Management" name="Offerwalls" />

        {/* Provider Cards */}
        <div className="row mt-4">
          {(providers.length > 0
            ? providers
            : [
                { _id: "1", name: "bitlabs", title: "BitLabs Surveys", appId: "", secretKey: "", isActive: true, conversionRate: 100 },
                { _id: "2", name: "cpx", title: "CPX Research", appId: "", secretKey: "", isActive: true, conversionRate: 100 },
              ]
          ).map((prov) => (
            <div className="col-md-6 mb-4" key={prov._id}>
              <div className="card shadow-sm border-0 p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0 text-uppercase">{prov.title || prov.name}</h5>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={prov.isActive}
                      onChange={(e) => handleUpdate(prov._id, { name: prov.name, isActive: e.target.checked })}
                    />
                    <label className="form-check-label fw-semibold">{prov.isActive ? "Active" : "Inactive"}</label>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">App / API Token</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ borderRadius: "8px" }}
                    placeholder={`Enter ${prov.title || prov.name} App Token`}
                    defaultValue={prov.appId}
                    onBlur={(e) => handleUpdate(prov._id, { name: prov.name, appId: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Secret Key (HMAC / Hash)</label>
                  <div className="position-relative">
                    <input
                      type={showSecretKey[prov._id] ? "text" : "password"}
                      className="form-control pe-5"
                      style={{ borderRadius: "8px" }}
                      placeholder="Enter Secret Key"
                      defaultValue={prov.secretKey}
                      onBlur={(e) => handleUpdate(prov._id, { name: prov.name, secretKey: e.target.value })}
                    />
                    <button
                      className="btn btn-link text-secondary position-absolute top-50 end-0 translate-middle-y me-2 p-1 text-decoration-none"
                      type="button"
                      style={{ zIndex: 5 }}
                      onClick={() => setShowSecretKey((prev) => ({ ...prev, [prov._id]: !prev[prov._id] }))}
                    >
                      <i className={showSecretKey[prov._id] ? "fa-solid fa-eye-slash text-muted" : "fa-solid fa-eye text-muted"}></i>
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Server-to-Server Key</label>
                  <div className="position-relative">
                    <input
                      type={showServerKey[prov._id] ? "text" : "password"}
                      className="form-control pe-5"
                      style={{ borderRadius: "8px" }}
                      placeholder="Enter Server-to-Server Key"
                      defaultValue={prov.serverKey}
                      onBlur={(e) => handleUpdate(prov._id, { name: prov.name, serverKey: e.target.value })}
                    />
                    <button
                      className="btn btn-link text-secondary position-absolute top-50 end-0 translate-middle-y me-2 p-1 text-decoration-none"
                      type="button"
                      style={{ zIndex: 5 }}
                      onClick={() => setShowServerKey((prev) => ({ ...prev, [prov._id]: !prev[prov._id] }))}
                    >
                      <i className={showServerKey[prov._id] ? "fa-solid fa-eye-slash text-muted" : "fa-solid fa-eye text-muted"}></i>
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Coins Conversion Rate (Per $1.00)</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ borderRadius: "8px" }}
                    defaultValue={prov.conversionRate || 100}
                    onBlur={(e) => handleUpdate(prov._id, { name: prov.name, conversionRate: Number(e.target.value) })}
                  />
                </div>

                <div className="p-3 bg-light rounded border mt-auto">
                  <small className="fw-bold text-secondary d-block mb-1">Postback Webhook URL:</small>
                  <code className="user-select-all text-break fw-semibold" style={{ color: "#7c4dff" }}>
                    {`${(baseURL || "https://admin.quietchat.in").replace(/\/$/, "")}/api/client/reward/${prov.name}/webhook`}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="d-flex align-items-center justify-content-between mt-4 mb-3">
          <div>
            <h4 className="fw-bold mb-1"><i className="ri-cellphone-line me-2 text-primary"></i>Interactive Mobile Offerwall Emulator</h4>
            <p className="text-muted mb-0">Experience 100% real mobile Flutter Offerwall webview simulation. Tap any survey to complete questions, trigger real-time webhooks, and see live coin additions!</p>
          </div>
        </div>

        <div className="row">
          {/* Left Side: Test Control Panel & Log Terminal */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm border-0 p-4 h-100">
              <h5 className="fw-bold mb-3"><i className="ri-settings-4-line me-2 text-info"></i>Emulator Control Panel</h5>
              
              <form onSubmit={handleRunManualTest}>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-bold mb-0">Select Active Test User</label>
                    <small className="text-muted" style={{ fontSize: "11px" }}>
                      {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"} found
                    </small>
                  </div>

                  {/* Search Input Bar */}
                  <div className="input-group mb-2">
                    <span className="input-group-text bg-light border-end-0" style={{ borderRadius: "10px 0 0 10px", borderColor: "#ced4da" }}>
                      <i className="ri-search-line text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0 fw-semibold"
                      style={{ height: "46px", borderRadius: "0 10px 10px 0", fontSize: "14px", color: "#1e1e2d" }}
                      placeholder="Search by Name, Email, Unique ID or Mongo ID..."
                      value={userSearchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>

                  {/* Filtered Dropdown */}
                  {filteredUsers.length > 0 ? (
                    <select
                      className="form-select fw-semibold"
                      style={{ height: "50px", borderRadius: "10px", padding: "10px 16px", fontSize: "15px", color: "#1e1e2d" }}
                      value={testUser}
                      onChange={(e) => setTestUser(e.target.value)}
                    >
                      {filteredUsers.map((u) => {
                        const displayName = u.name || "User";
                        const shortId = u.uniqueId ? `ID: ${u.uniqueId}` : `ID: ...${u._id.slice(-6)}`;
                        return (
                          <option key={u._id} value={u._id} style={{ padding: "10px", fontSize: "15px" }}>
                            👤 {displayName} ({shortId})
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control fw-semibold"
                      style={{ height: "50px", borderRadius: "10px", padding: "10px 16px", fontSize: "15px", color: "#1e1e2d" }}
                      placeholder="Enter User Mongo ID"
                      value={testUser}
                      onChange={(e) => setTestUser(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Provider</label>
                    <select
                      className="form-select fw-semibold"
                      style={{ height: "50px", borderRadius: "10px", padding: "10px 16px", fontSize: "15px", color: "#1e1e2d" }}
                      value={testProvider}
                      onChange={(e) => {
                        setTestProvider(e.target.value);
                        setMobileTab(e.target.value as any);
                      }}
                    >
                      <option value="bitlabs">BitLabs Surveys</option>
                      <option value="cpx">CPX Research</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Custom Coins</label>
                    <input
                      type="number"
                      className="form-control fw-semibold"
                      style={{ height: "50px", borderRadius: "10px", padding: "10px 16px", fontSize: "15px", color: "#1e1e2d" }}
                      value={testCoins}
                      onChange={(e) => setTestCoins(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm"
                  disabled={testSimulating}
                  style={{ backgroundColor: "#7c4dff", borderColor: "#7c4dff" }}
                >
                  {testSimulating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Simulating Webhook Callback...
                    </>
                  ) : (
                    <>
                      <i className="ri-play-circle-fill me-1 fs-5 align-middle"></i> Trigger Manual Webhook Test
                    </>
                  )}
                </button>
              </form>

              {/* Execution Console Output */}
              <div className="mt-4">
                <h6 className="fw-bold mb-2 text-secondary"><i className="ri-terminal-box-line me-1"></i>Real-time Execution Console</h6>
                {testResult ? (
                  <div className={`p-3 rounded border ${testResult.status ? "bg-success-subtle border-success" : "bg-danger-subtle border-danger"}`}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className={`badge ${testResult.status ? "bg-success" : "bg-danger"}`}>
                        {testResult.status ? "✓ WEBHOOK TEST PASSED" : "❌ TEST FAILED"}
                      </span>
                      <small className="text-muted">{new Date().toLocaleTimeString()}</small>
                    </div>

                    {testResult.status ? (
                      <div className="small">
                        <p className="mb-1"><strong>User Mongo ID:</strong> <code>{testUser}</code></p>
                        <p className="mb-1"><strong>Provider Tested:</strong> {testProvider.toUpperCase()}</p>
                        <p className="mb-1"><strong>Coins Credited:</strong> +{testResult.result?.coinsRewarded || testCoins} Coins</p>
                        <p className="mb-1"><strong>New Wallet Balance:</strong> {testResult.result?.newBalance || userBalance} Coins</p>
                        <p className="mb-0"><strong>Transaction Ref:</strong> <code>{testResult.result?.transactionId || "N/A"}</code></p>
                      </div>
                    ) : (
                      <div className="text-danger small">
                        <strong>Error:</strong> {testResult.error || "Failed to execute callback"}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-light rounded text-center text-muted border border-dashed">
                    <small>No test runs executed yet. Tap any survey inside the mobile screen to complete an interactive survey!</small>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Ultra-Realistic Mobile Phone Device Frame */}
          <div className="col-lg-6 mb-4 d-flex justify-content-center">
            <div
              style={{
                width: "370px",
                height: "670px",
                backgroundColor: "#0d0d11",
                borderRadius: "48px",
                padding: "12px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 12px #22222a",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Mobile Screen Shell */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#f4f6f9",
                  borderRadius: "36px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {/* Mobile Top Status Bar & Notch */}
                <div
                  style={{
                    height: "30px",
                    backgroundColor: "#121217",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 18px",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  <span>17:18</span>
                  {/* Dynamic Island Punch Hole */}
                  <div
                    style={{
                      width: "85px",
                      height: "14px",
                      backgroundColor: "#000",
                      borderRadius: "10px",
                    }}
                  ></div>
                  <span>
                    <i className="ri-wifi-line me-1"></i>
                    <i className="ri-battery-charge-fill text-success"></i>
                  </span>
                </div>

                {/* Mobile App Navigation Header */}
                <div
                  style={{
                    backgroundColor: "#7c4dff",
                    color: "#fff",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 4px 12px rgba(124, 77, 255, 0.3)",
                  }}
                >
                  <div className="d-flex align-items-center">
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "14px",
                        marginRight: "10px",
                      }}
                    >
                      💬
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold fs-6" style={{ lineHeight: "1.2" }}>QuietChat Rewards</h6>
                      <small style={{ fontSize: "11px", opacity: 0.9 }}>
                        {selectedUserObj ? selectedUserObj.name || "Test User" : "Demo User"}
                      </small>
                    </div>
                  </div>

                  {/* Real-time Coin Counter Badge */}
                  <div
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.25)",
                      backdropFilter: "blur(10px)",
                      borderRadius: "20px",
                      padding: "5px 12px",
                      fontWeight: 800,
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    🪙 {userBalance} Coins
                  </div>
                </div>

                {/* Mobile View Body Container */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
                  
                  {/* TAB 1: OFFERS WEBVIEW */}
                  {mobileNav === "offers" && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      {/* Offerwall Sub-tabs */}
                      <div style={{ backgroundColor: "#fff", display: "flex", borderBottom: "1px solid #e0e0e0" }}>
                        <button
                          onClick={() => {
                            setMobileTab("bitlabs");
                            setTestProvider("bitlabs");
                          }}
                          style={{
                            flex: 1,
                            padding: "10px 0",
                            border: "none",
                            backgroundColor: mobileTab === "bitlabs" ? "#f4f6f9" : "#fff",
                            borderBottom: mobileTab === "bitlabs" ? "3px solid #7c4dff" : "none",
                            color: mobileTab === "bitlabs" ? "#7c4dff" : "#666",
                            fontWeight: 700,
                            fontSize: "12px",
                          }}
                        >
                          BitLabs Surveys
                        </button>
                        <button
                          onClick={() => {
                            setMobileTab("cpx");
                            setTestProvider("cpx");
                          }}
                          style={{
                            flex: 1,
                            padding: "10px 0",
                            border: "none",
                            backgroundColor: mobileTab === "cpx" ? "#f4f6f9" : "#fff",
                            borderBottom: mobileTab === "cpx" ? "3px solid #7c4dff" : "none",
                            color: mobileTab === "cpx" ? "#7c4dff" : "#666",
                            fontWeight: 700,
                            fontSize: "12px",
                          }}
                        >
                          CPX Research
                        </button>
                      </div>

                      {/* Survey List Scroll View */}
                      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#888", textTransform: "uppercase" }}>
                            Live Webview ({mobileTab.toUpperCase()})
                          </span>
                          <span className="badge bg-success-subtle text-success" style={{ fontSize: "10px" }}>● Connected</span>
                        </div>

                        {sampleSurveys[mobileTab].map((srv) => (
                          <div
                            key={srv.id}
                            style={{
                              backgroundColor: "#fff",
                              borderRadius: "16px",
                              padding: "14px",
                              marginBottom: "10px",
                              boxShadow: "0 3px 10px rgba(0,0,0,0.04)",
                              border: "1px solid #eef0f4",
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="badge bg-primary-subtle text-primary" style={{ fontSize: "10px" }}>{srv.category}</span>
                              <span className="fw-extrabold text-success" style={{ fontSize: "13px" }}>+ {srv.coins} Coins</span>
                            </div>

                            <h6 className="fw-bold mb-1" style={{ fontSize: "13px", color: "#2c3e50" }}>{srv.title}</h6>
                            
                            <div className="d-flex align-items-center justify-content-between mt-2">
                              <small className="text-muted" style={{ fontSize: "11px" }}>
                                ⏱ {srv.duration} • {srv.partner}
                              </small>

                              <button
                                onClick={() => startSurveyModal(srv)}
                                className="btn btn-sm px-3 py-1 text-white fw-bold shadow-sm"
                                style={{
                                  backgroundColor: "#7c4dff",
                                  borderRadius: "10px",
                                  fontSize: "11px",
                                }}
                              >
                                Start Survey →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: WALLET VIEW */}
                  {mobileNav === "wallet" && (
                    <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
                      <div
                        style={{
                          background: "linear-gradient(135deg, #7c4dff 0%, #4a148c 100%)",
                          color: "#fff",
                          borderRadius: "20px",
                          padding: "20px",
                          boxShadow: "0 10px 20px rgba(124, 77, 255, 0.3)",
                        }}
                      >
                        <small style={{ textTransform: "uppercase", letterSpacing: "1px", opacity: 0.8, fontSize: "10px" }}>My Coin Balance</small>
                        <h2 className="fw-extrabold my-1">🪙 {userBalance}</h2>
                        <small className="d-block mb-3" style={{ opacity: "0.9" }}>
                          Equivalent Value: ~ ${(userBalance / 100).toFixed(2)} USD
                        </small>
                        <button className="btn btn-light btn-sm fw-bold w-100 text-purple" style={{ color: "#7c4dff", borderRadius: "10px" }}>
                          Withdraw Funds →
                        </button>
                      </div>

                      <div className="mt-3 card p-3 border-0 shadow-sm rounded-4">
                        <h6 className="fw-bold mb-2 fs-6">Wallet Perks & Status</h6>
                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <span className="text-muted small">Account Status</span>
                          <span className="badge bg-success">Active / Unfrozen</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <span className="text-muted small">Conversion Rate</span>
                          <span className="fw-bold small">100 Coins = $1.00</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center py-2">
                          <span className="text-muted small">Daily Earnings Cap</span>
                          <span className="fw-bold small text-primary">Unlimited</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: HISTORY VIEW */}
                  {mobileNav === "history" && (
                    <div style={{ flex: 1, padding: "12px", overflowY: "auto" }}>
                      <h6 className="fw-bold mb-3 px-1 fs-6">Transaction History</h6>
                      {txHistory.map((item) => (
                        <div key={item.id} className="card p-3 mb-2 border-0 shadow-sm rounded-4">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <span className="badge bg-success-subtle text-success mb-1" style={{ fontSize: "9px" }}>{item.provider}</span>
                              <h6 className="fw-bold mb-0" style={{ fontSize: "12px" }}>{item.title}</h6>
                              <small className="text-muted" style={{ fontSize: "10px" }}>{item.time}</small>
                            </div>
                            <span className="fw-bold text-success" style={{ fontSize: "13px" }}>+ {item.coins}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FULL-SCREEN INTERACTIVE SURVEY QUESTIONNAIRE WEBVIEW MODAL INSIDE MOBILE PHONE */}
                  {activeSurvey && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "#fff",
                        zIndex: 100,
                        display: "flex",
                        flexDirection: "column",
                        animation: "slideInUp 0.3s ease-out",
                      }}
                    >
                      {/* Webview Top Header */}
                      <div
                        style={{
                          backgroundColor: "#1e1e2d",
                          color: "#fff",
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <span className="badge bg-primary me-2" style={{ fontSize: "10px" }}>{mobileTab.toUpperCase()} WEBVIEW</span>
                          <span className="fw-bold text-truncate" style={{ maxWidth: "160px", fontSize: "12px" }}>
                            {activeSurvey.title}
                          </span>
                        </div>
                        <button
                          onClick={closeSurveyModal}
                          style={{ background: "none", border: "none", color: "#fff", fontSize: "16px" }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Survey Content */}
                      {!completedSuccess ? (
                        <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column" }}>
                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <small className="fw-bold text-secondary">Question {surveyStep} of 3</small>
                              <small className="fw-bold text-primary">{Math.round((surveyStep / 3) * 100)}%</small>
                            </div>
                            <div className="progress" style={{ height: "6px" }}>
                              <div
                                className="progress-bar bg-primary"
                                role="progressbar"
                                style={{ width: `${(surveyStep / 3) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Question Box */}
                          <h6 className="fw-bold my-2" style={{ fontSize: "14px", color: "#2c3e50" }}>
                            {surveyQuestions[surveyStep - 1].q}
                          </h6>

                          {/* Option Pills */}
                          <div className="my-3">
                            {surveyQuestions[surveyStep - 1].options.map((opt, i) => (
                              <div
                                key={i}
                                onClick={() => setSelectedOption(opt)}
                                style={{
                                  padding: "12px 14px",
                                  borderRadius: "12px",
                                  backgroundColor: selectedOption === opt ? "#f0e6ff" : "#f8fafc",
                                  border: selectedOption === opt ? "2px solid #7c4dff" : "1px solid #e2e8f0",
                                  color: selectedOption === opt ? "#7c4dff" : "#334155",
                                  fontWeight: selectedOption === opt ? 700 : 500,
                                  marginBottom: "8px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                }}
                              >
                                {opt}
                              </div>
                            ))}
                          </div>

                          <div className="mt-auto">
                            <button
                              onClick={handleNextStep}
                              disabled={!selectedOption || isCompleting}
                              className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm"
                              style={{ backgroundColor: "#7c4dff", borderColor: "#7c4dff", borderRadius: "12px" }}
                            >
                              {isCompleting ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                  Submitting Callback...
                                </>
                              ) : surveyStep < 3 ? (
                                "Next Question →"
                              ) : (
                                `Submit & Claim +${activeSurvey.coins} Coins 🎉`
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* SUCCESS SCREEN INSIDE MOBILE */
                        <div
                          style={{
                            flex: 1,
                            padding: "24px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            backgroundColor: "#fff",
                          }}
                        >
                          <div style={{ fontSize: "50px" }} className="mb-2">🎉 🪙</div>
                          <h5 className="fw-extrabold text-success mb-1">Survey Completed!</h5>
                          <p className="text-muted small mb-3">
                            Congratulations! Your survey responses were verified and rewards credited instantly.
                          </p>

                          <div className="p-3 bg-success-subtle rounded-4 w-100 mb-4 border border-success">
                            <small className="text-muted d-block">Reward Added</small>
                            <h3 className="fw-extrabold text-success mb-0">+{activeSurvey.coins} Coins</h3>
                          </div>

                          <button
                            onClick={closeSurveyModal}
                            className="btn btn-success w-100 py-2.5 fw-bold shadow-sm"
                            style={{ borderRadius: "12px" }}
                          >
                            Return to Offerwall
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Mobile Bottom Navigation Bar */}
                <div
                  style={{
                    backgroundColor: "#fff",
                    borderTop: "1px solid #eef0f4",
                    padding: "8px 0 10px 0",
                    display: "flex",
                    justifyContent: "space-around",
                    color: "#999",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  <div
                    onClick={() => setMobileNav("offers")}
                    style={{ color: mobileNav === "offers" ? "#7c4dff" : "#888", cursor: "pointer" }}
                    className="text-center"
                  >
                    <i className="ri-survey-line fs-5 d-block"></i> Offers
                  </div>
                  <div
                    onClick={() => setMobileNav("wallet")}
                    style={{ color: mobileNav === "wallet" ? "#7c4dff" : "#888", cursor: "pointer" }}
                    className="text-center"
                  >
                    <i className="ri-wallet-3-line fs-5 d-block"></i> Wallet
                  </div>
                  <div
                    onClick={() => setMobileNav("history")}
                    style={{ color: mobileNav === "history" ? "#7c4dff" : "#888", cursor: "pointer" }}
                    className="text-center"
                  >
                    <i className="ri-history-line fs-5 d-block"></i> History
                  </div>
                </div>

                {/* Mobile Home Indicator */}
                <div
                  style={{
                    height: "10px",
                    backgroundColor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingBottom: "4px",
                  }}
                >
                  <div style={{ width: "110px", height: "4px", backgroundColor: "#ccc", borderRadius: "4px" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
