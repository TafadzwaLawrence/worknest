import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobRequisition } from './entities/job-requisition.entity.js';
import { JobPosting } from './entities/job-posting.entity.js';
import { Applicant } from './entities/applicant.entity.js';
import { ApplicantContact } from './entities/applicant-contact.entity.js';
import { ApplicantDocument } from './entities/applicant-document.entity.js';
import { Pipeline } from './entities/pipeline.entity.js';
import { PipelineStage } from './entities/pipeline-stage.entity.js';
import { Application } from './entities/application.entity.js';
import { Interview } from './entities/interview.entity.js';
import { Interviewer } from './entities/interviewer.entity.js';
import { Offer } from './entities/offer.entity.js';
import { Note } from './entities/note.entity.js';
import { Tag } from './entities/tag.entity.js';
import { TaggedItem } from './entities/tagged-item.entity.js';
import { Evaluation } from './entities/evaluation.entity.js';
import { JobService } from './services/job.service.js';
import { ApplicantService } from './services/applicant.service.js';
import { ApplicationService } from './services/application.service.js';
import { InterviewOfferService } from './services/interview-offer.service.js';
import { JobRequisitionController, JobPostingController } from './controllers/job.controller.js';
import { ApplicantController } from './controllers/applicant.controller.js';
import { ApplicationController, PipelineController } from './controllers/application.controller.js';
import { InterviewController, OfferController, RecruitmentMiscController } from './controllers/interview-offer.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobRequisition,
      JobPosting,
      Applicant,
      ApplicantContact,
      ApplicantDocument,
      Pipeline,
      PipelineStage,
      Application,
      Interview,
      Interviewer,
      Offer,
      Note,
      Tag,
      TaggedItem,
      Evaluation,
    ]),
  ],
  controllers: [
    JobRequisitionController,
    JobPostingController,
    ApplicantController,
    ApplicationController,
    PipelineController,
    InterviewController,
    OfferController,
    RecruitmentMiscController,
  ],
  providers: [
    JobService,
    ApplicantService,
    ApplicationService,
    InterviewOfferService,
  ],
  exports: [ApplicantService, ApplicationService],
})
export class RecruitmentModule {}
