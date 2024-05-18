export interface File{
  id: string;
  last_checked_size: number;
  last_check_time: string;
  last_read_position: number;
  path: string;
  project: string;
  service_account_key: string;
  type: string;
}
