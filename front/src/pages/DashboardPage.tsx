import useAuth from "../contexts/useAuth";

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <>
      <h2 data-testid="dashboard-title">Bem-vindo, {user?.username}!</h2>
      <p data-testid="dashboard-user-id">ID: {user?.id}</p>
    </>
  );
};

export default DashboardPage;
