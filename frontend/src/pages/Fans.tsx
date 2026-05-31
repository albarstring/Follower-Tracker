import { UserList } from '../components/ui/UserList';
import { useData } from '../context/DataContext';

export default function Fans() {
  const { fans, isDataReady } = useData();

  return (
    <UserList 
      title="Fans" 
      description="People who follow you but you don't follow back." 
      emptyMessage="Upload your data to see your fans."
      users={fans}
      isDataReady={isDataReady} 
    />
  );
}


