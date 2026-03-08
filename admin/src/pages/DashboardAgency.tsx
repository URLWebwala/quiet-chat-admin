import RootLayout from "@/component/layout/Layout";

const DashboardAgency = () => {
    return(
        <h1>Dashboard Agency Releted Page</h1>
    )
}

DashboardAgency.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
  };
  
  export default DashboardAgency;