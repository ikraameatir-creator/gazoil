import { User } from './types';

// The only initial data is the default admin user.
// The app will start with no vehicles/drivers and no fuel logs.
export const INITIAL_ADMIN: User = { 
  id: 1, 
  username: 'admin', 
  password: 'admin', 
  role: 'admin',
  driverName: 'Admin'
};
