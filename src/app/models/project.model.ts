export type ProjectStatus = 'active' | 'on-hold' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  client_name: string | null;
  client_contact: string | null;
  budget: number | null;
  deadline: string | null;
  share_token: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: ProjectStatus;
  client_name?: string;
  client_contact?: string;
  budget?: number;
  deadline?: string;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}
