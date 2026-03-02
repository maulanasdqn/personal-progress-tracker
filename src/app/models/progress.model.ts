export interface Progress {
  id: string;
  issue_id: string;
  description: string;
  completion_percentage: number;
  created_at: string;
}

export interface CreateProgressDto {
  description: string;
  completion_percentage?: number;
}

export interface UpdateProgressDto extends Partial<CreateProgressDto> {}
