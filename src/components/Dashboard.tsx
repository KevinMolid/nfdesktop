import SafeWrapper from "./SafeWrapper";
import Links from "./Links";
import Tasklist from "./Tasklist";
import Notes from "./Notes";
import Burgermenu from "./Burgermenu";

type DashboardProps = {
  user: { id: string; username: string; role: string };
  widgets: { name: string; active: boolean }[];
  toggleActive: (name: string) => void;
};

const Dashboard = ({ user, widgets, toggleActive }: DashboardProps) => {
  return (
    <div className="container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <Burgermenu widgets={widgets} toggleActive={toggleActive} />
      </div>
      <div className="widget-container">
        <SafeWrapper fallback={<div>Kunne ikke laste lenker</div>}>
          {widgets[0].active && (
            <Links user={user} toggleActive={toggleActive} />
          )}
        </SafeWrapper>

        <SafeWrapper fallback={<div>Kunne ikke laste oppgaver</div>}>
          {widgets[1].active && (
            <Tasklist user={user} toggleActive={toggleActive} />
          )}
        </SafeWrapper>

        <SafeWrapper fallback={<div>Kunne ikke laste notater</div>}>
          {widgets[2].active && (
            <Notes user={user} toggleActive={toggleActive} />
          )}
        </SafeWrapper>
      </div>
    </div>
  );
};

export default Dashboard;
