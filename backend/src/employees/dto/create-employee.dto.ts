export class CreateEmployeeDto {
  fullName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  salary?: number;
  isActive?: boolean;
}
