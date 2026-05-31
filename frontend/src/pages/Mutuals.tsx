import { UserList } from '../components/ui/UserList';
import { useData } from '../context/DataContext';

export default function Mutuals() {
  const { mutuals, isDataReady } = useData();

  return (
    <UserList 
      title="Mutual Followers" 
      description="People who follow you and you follow them back." 
      emptyMessage="Upload your data to see mutuals."
      users={mutuals}
      isDataReady={isDataReady} 
    />
  );
}


