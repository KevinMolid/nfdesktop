import AppVersionControl from "./AppVersionControl";

type User = {
  id: string;
  username: string;
  role: string;
};

type SettingsProps = {
  user: User;
};

const Settings = ({ user }: SettingsProps) => {
  return (
    <div className="container">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <AppVersionControl user={user}/>
    </div>
  );
};

export default Settings;
