import Userlist from "./Userlist";
import SafeWrapper from "./SafeWrapper";

type UsersProps = {
  user: { id: string; username: string; role: string };
  toggleActive: (name: string) => void;
};

const Users = ({ user, toggleActive }: UsersProps) => {

  return (
    <div className="container">
      <div className="page-header">
        <h1>Users</h1>
      </div>

      <div className="widget-container">
        <SafeWrapper fallback={<div>Could not load users</div>}>
            <Userlist user={user} toggleActive={toggleActive} />
        </SafeWrapper>
      </div>
    </div>
  );
};


export default Users;
