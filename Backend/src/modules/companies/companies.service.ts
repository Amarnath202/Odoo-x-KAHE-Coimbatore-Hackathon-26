import { companiesRepository } from './companies.repository';
import { AppError } from '../../common/utils/AppError';
import { CreateCompanyDto, UpdateCompanyDto } from './companies.validator';

export class CompaniesService {
  async list(page: number, limit: number) {
    return companiesRepository.findAll(page, limit);
  }

  async getById(id: string) {
    const company = await companiesRepository.findById(id);
    if (!company) throw AppError.notFound('Company not found');
    return company;
  }

  async create(dto: CreateCompanyDto) {
    return companiesRepository.create(dto);
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.getById(id);
    return companiesRepository.update(id, dto);
  }
}

export const companiesService = new CompaniesService();
