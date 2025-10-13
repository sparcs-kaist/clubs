import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1760367688675 implements MigrationInterface {
  name = "InitialSchema1760367688675";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`auth_activated_refresh_tokens\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`expires_at\` datetime NOT NULL, \`refresh_token\` text NOT NULL, INDEX \`auth_activated_refresh_tokens_user_id_user_id_fk\` (\`user_id\`), INDEX \`expires_at_idx\` (\`expires_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`employee_t\` (\`id\` int NOT NULL AUTO_INCREMENT, \`employee_id\` int NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, UNIQUE INDEX \`employee_t_employee_id_unique\` (\`employee_id\`), UNIQUE INDEX \`IDX_c3df18046e886ec92dc9163114\` (\`employee_id\`), UNIQUE INDEX \`REL_c3df18046e886ec92dc9163114\` (\`employee_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`employee\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`employee_user_id_user_id_fk\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_participant\` (\`id\` int NOT NULL AUTO_INCREMENT, \`activity_id\` int NOT NULL, \`student_id\` int NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`activity_participant_student_id_fk\` (\`student_id\`), INDEX \`activity_participant_activity_id_fk\` (\`activity_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`club_delegate_change_request_status_enum\` (\`enum_id\` int NOT NULL AUTO_INCREMENT, \`enum_name\` varchar(255) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`enum_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`club_delegate_change_request\` (\`id\` int NOT NULL AUTO_INCREMENT, \`club_id\` int NOT NULL, \`prev_student_id\` int NOT NULL, \`student_id\` int NOT NULL, \`club_delegate_change_request_status_enum_id\` int NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`club_delegate_change_request_fk\` (\`club_delegate_change_request_status_enum_id\`), INDEX \`club_delegate_change_request_student_id_student_id_fk\` (\`student_id\`), INDEX \`club_delegate_change_request_prev_student_id_student_id_fk\` (\`prev_student_id\`), INDEX \`club_delegate_change_request_club_id_club_id_fk\` (\`club_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`club_delegate_d\` (\`id\` int NOT NULL AUTO_INCREMENT, \`club_id\` int NOT NULL, \`student_id\` int NOT NULL, \`club_delegate_enum_id\` int NOT NULL, \`start_term\` datetime NOT NULL, \`end_term\` datetime NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`club_delegate_d_student_id_student_id_fk\` (\`student_id\`), INDEX \`club_delegate_d_club_id_club_id_fk\` (\`club_id\`), INDEX \`club_delegate_d_club_delegate_enum_id_fk\` (\`club_delegate_enum_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`club_building_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`building_name\` varchar(30) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`club_room_t\` (\`id\` int NOT NULL AUTO_INCREMENT, \`club_id\` int NOT NULL, \`club_building_enum\` int NOT NULL, \`room_location\` varchar(20) NULL, \`room_password\` varchar(20) NULL, \`semester_id\` int NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`club_room_t_semester_id_semester_d_id_fk\` (\`semester_id\`), INDEX \`club_room_t_club_building_enum_club_building_enum_id_fk\` (\`club_building_enum\`), INDEX \`club_room_t_club_id_club_id_fk\` (\`club_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`club_status_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status_name\` varchar(30) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`professor_t\` (\`id\` int NOT NULL AUTO_INCREMENT, \`professor_id\` int NOT NULL, \`professor_enum\` int NULL, \`department\` int NULL, \`start_term\` date NOT NULL, \`end_term\` date NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, UNIQUE INDEX \`professor_t_professor_id_unique\` (\`professor_id\`), UNIQUE INDEX \`IDX_951d8f54dbea209bc083eb2296\` (\`professor_id\`), UNIQUE INDEX \`REL_951d8f54dbea209bc083eb2296\` (\`professor_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`club_division_t\` (\`id\` int NOT NULL AUTO_INCREMENT, \`club_id\` int NOT NULL, \`division_id\` int NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`club_division_t_division_id_division_id_fk\` (\`division_id\`), INDEX \`club_division_t_club_id_club_id_fk\` (\`club_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`district\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(10) NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`division_president_d\` (\`id\` int NOT NULL AUTO_INCREMENT, \`division_id\` int NOT NULL, \`student_id\` int NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NULL, \`originated_club_id\` int NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`division_president_d_originated_club_id_club_id_fk\` (\`originated_club_id\`), INDEX \`division_president_d_student_id_student_id_fk\` (\`student_id\`), INDEX \`division_president_d_division_id_division_id_fk\` (\`division_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meeting_announcement\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meeting_attendance_time_t\` (\`id\` int NOT NULL AUTO_INCREMENT, \`meeting_id\` int NOT NULL, \`user_id\` int NOT NULL, \`start_term\` datetime NOT NULL, \`end_term\` datetime NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`user_meeting_attendance_time_t_id_fk\` (\`user_id\`), INDEX \`meeting_meeting_attendance_time_t_id_fk\` (\`meeting_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meeting_agenda\` (\`id\` int NOT NULL AUTO_INCREMENT, \`enum\` int NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`is_editable_divisionPresident\` tinyint(1) NOT NULL, \`is_editable_representative\` tinyint(1) NOT NULL, \`is_editable_self\` tinyint(1) NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meeting_agenda_content\` (\`id\` int NOT NULL AUTO_INCREMENT, \`content\` text NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meeting_vote_result\` (\`id\` int NOT NULL AUTO_INCREMENT, \`vote_id\` int NOT NULL, \`user_id\` int NOT NULL, \`choice_id\` int NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`meeting_vote_choice_result_id_fk\` (\`choice_id\`), INDEX \`user_meeting_vote_result_id_fk\` (\`user_id\`), INDEX \`meeting_agenda_vote_result_id_fk\` (\`vote_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meeting_vote_choice\` (\`id\` int NOT NULL AUTO_INCREMENT, \`vote_id\` int NOT NULL, \`choice\` varchar(255) NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`meeting_agenda_vote_choice_id_fk\` (\`vote_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meeting_agenda_vote\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meeting_mapping\` (\`id\` int NOT NULL AUTO_INCREMENT, \`meeting_id\` int NOT NULL, \`meeting_agenda_id\` int NOT NULL, \`meeting_agenda_position\` int NOT NULL, \`meeting_agenda_entity_type\` int NOT NULL, \`meeting_agenda_content_id\` int NULL, \`meeting_agenda_vote_id\` int NULL, \`meeting_agenda_entity_position\` int NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`meeting_agenda_vote_meeting_mapping_id_fk\` (\`meeting_agenda_vote_id\`), INDEX \`meeting_agenda_content_meeting_mapping_id_fk\` (\`meeting_agenda_content_id\`), INDEX \`meeting_agenda_meeting_mapping_id_fk\` (\`meeting_agenda_id\`), INDEX \`meeting_meeting_mapping_id_fk\` (\`meeting_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meeting\` (\`id\` int NOT NULL AUTO_INCREMENT, \`meeting_announcement_id\` int NULL, \`meeting_type_enum\` int NOT NULL, \`is_regular_meeting\` tinyint(1) NOT NULL, \`location_kr\` varchar(255) NULL, \`location_en\` varchar(255) NULL, \`start_datetime\` datetime NOT NULL, \`end_datetime\` datetime NULL, \`meeting_group_tag\` varchar(255) NOT NULL, \`meeting_status_enum\` int NOT NULL DEFAULT '1', \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`meeting_announcement_id_fk\` (\`meeting_announcement_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meeting_role_enum\` (\`id\` int NOT NULL, \`name\` varchar(30) NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meeting_attendance_day\` (\`id\` int NOT NULL AUTO_INCREMENT, \`meeting_id\` int NOT NULL, \`meeting_role_enum\` int NOT NULL, \`which_club_id\` int NULL, \`which_division_id\` int NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`meeting_attendance_day_role_enum_fk\` (\`meeting_role_enum\`), INDEX \`meeting_meeting_attendance_day_id_fk\` (\`meeting_id\`), INDEX \`meeting_attendance_day_which_division_id_division_id_fk\` (\`which_division_id\`), INDEX \`meeting_attendance_day_which_club_id_club_id_fk\` (\`which_club_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`division\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(10) NOT NULL, \`start_term\` date NOT NULL DEFAULT '2017-03-01', \`end_term\` date NULL, \`district_id\` int NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`division_district_id_district_id_fk\` (\`district_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`file\` (\`id\` varchar(128) NOT NULL, \`name\` varchar(255) NOT NULL, \`extension\` varchar(30) NOT NULL, \`size\` int NOT NULL, \`user_id\` int NOT NULL, \`signed_at\` datetime NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`file_user_id_user_id_fk\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`registration_executive_comment\` (\`id\` int NOT NULL AUTO_INCREMENT, \`registration_id\` int NOT NULL, \`executive_id\` int NOT NULL, \`content\` text NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`registration_executive_comment_executive_id_fk\` (\`executive_id\`), INDEX \`registration_executive_comment_registration_id_fk\` (\`registration_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`registration_status_enum\` (\`enum_id\` int NOT NULL AUTO_INCREMENT, \`enum_name\` varchar(30) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`enum_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`registration_type_enum\` (\`enum_id\` int NOT NULL AUTO_INCREMENT, \`enum_name\` varchar(30) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`enum_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`registration\` (\`id\` int NOT NULL AUTO_INCREMENT, \`club_id\` int NULL, \`semester_d_id\` int NULL, \`registration_application_type_enum_id\` int NOT NULL, \`registration_application_status_enum_id\` int NOT NULL, \`club_name_kr\` varchar(30) NULL, \`club_name_en\` varchar(100) NULL, \`student_id\` int NOT NULL, \`phone_number\` varchar(30) NULL, \`founded_at\` date NOT NULL, \`division_id\` int NOT NULL, \`activity_field_kr\` varchar(255) NULL, \`activity_field_en\` varchar(255) NULL, \`professor_id\` int NULL, \`division_consistency\` text NULL, \`foundation_purpose\` text NULL, \`activity_plan\` text NULL, \`registration_activity_plan_file_id\` varchar(128) NULL, \`registration_club_rule_file_id\` varchar(128) NULL, \`registration_external_instruction_file_id\` varchar(128) NULL, \`professor_approved_at\` timestamp NULL, \`reviewed_at\` timestamp NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`registration_external_instruction_file_id_file_id_fk\` (\`registration_external_instruction_file_id\`), INDEX \`registration_club_rule_file_id_file_id_fk\` (\`registration_club_rule_file_id\`), INDEX \`registration_activity_plan_file_id_file_id_fk\` (\`registration_activity_plan_file_id\`), INDEX \`registration_registration_status_enum_id_fk\` (\`registration_application_status_enum_id\`), INDEX \`registration_registration_type_enum_id_fk\` (\`registration_application_type_enum_id\`), INDEX \`registration_semester_d_id_fk\` (\`semester_d_id\`), INDEX \`registration_professor_id_professor_id_fk\` (\`professor_id\`), INDEX \`registration_division_id_division_id_fk\` (\`division_id\`), INDEX \`registration_student_id_student_id_fk\` (\`student_id\`), INDEX \`registration_club_id_club_id_fk\` (\`club_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`professor\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`professor_user_id_user_id_fk\` (\`user_id\`), UNIQUE INDEX \`professor_email_unique\` (\`email\`), UNIQUE INDEX \`IDX_492e744e6333071da912c7d651\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`club_t\` (\`id\` int NOT NULL AUTO_INCREMENT, \`club_id\` int NOT NULL, \`club_status_enum_id\` int NOT NULL, \`characteristic_kr\` varchar(255) NULL, \`characteristic_en\` varchar(255) NULL, \`professor_id\` int NULL, \`semester_id\` int NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`club_t_semester_id_semester_d_id_fk\` (\`semester_id\`), INDEX \`club_t_professor_id_professor_id_fk\` (\`professor_id\`), INDEX \`club_t_club_status_enum_id_club_status_enum_id_fk\` (\`club_status_enum_id\`), INDEX \`club_t_club_id_club_id_fk\` (\`club_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`professor_sign_status\` (\`id\` int NOT NULL AUTO_INCREMENT, \`club_id\` int NOT NULL, \`semester_id\` int NOT NULL, \`signed\` tinyint(1) NOT NULL DEFAULT '0', \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`professor_sign_status_semester_id_fk\` (\`semester_id\`), INDEX \`professor_sign_status_club_id_fk\` (\`club_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`registration_application_student_status_enum\` (\`enum_id\` int NOT NULL AUTO_INCREMENT, \`enum_name\` varchar(255) NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`enum_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`registration_application_student\` (\`id\` int NOT NULL AUTO_INCREMENT, \`student_id\` int NOT NULL, \`club_id\` int NOT NULL, \`semester_d_id\` int NULL, \`registration_application_student_status_enum\` int NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`registration_application_student_status_enum_id_fk\` (\`registration_application_student_status_enum\`), INDEX \`registration_application_student_semester_d_id_semester_d_id_fk\` (\`semester_d_id\`), INDEX \`registration_application_student_club_id_club_id_fk\` (\`club_id\`), INDEX \`registration_application_student_student_id_student_id_fk\` (\`student_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`registration_deadline_d\` (\`id\` int NOT NULL AUTO_INCREMENT, \`semester_d_id\` int NULL, \`registration_deadline_enum_id\` int NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`registration_deadline_d_semester_d_id_semester_d_id_fk\` (\`semester_d_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`semester_d\` (\`id\` int NOT NULL AUTO_INCREMENT, \`year\` int NOT NULL, \`name\` varchar(10) NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`club_student_t\` (\`id\` int NOT NULL AUTO_INCREMENT, \`student_id\` int NOT NULL, \`club_id\` int NOT NULL, \`semester_id\` int NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`club_student_t_semester_id_semester_d_id_fk\` (\`semester_id\`), INDEX \`club_student_t_club_id_club_id_fk\` (\`club_id\`), INDEX \`club_student_t_student_id_student_id_fk\` (\`student_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`common_space_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type_name\` varchar(30) NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`common_space\` (\`id\` int NOT NULL AUTO_INCREMENT, \`common_space_enum\` int NOT NULL, \`available_hours_per_week\` int NOT NULL, \`available_hours_per_day\` int NOT NULL, \`space_name\` varchar(30) NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL, \`deleted_at\` timestamp NULL, INDEX \`common_space_common_space_enum_common_space_enum_id_fk\` (\`common_space_enum\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`common_space_usage_order_d\` (\`id\` int NOT NULL AUTO_INCREMENT, \`common_space_id\` int NOT NULL, \`club_id\` int NOT NULL, \`charge_student_id\` int NOT NULL, \`student_phone_number\` varchar(30) NOT NULL, \`start_term\` datetime NOT NULL, \`end_term\` datetime NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL, \`deleted_at\` timestamp NULL, INDEX \`common_space_usage_order_d_charge_student_id_student_id_fk\` (\`charge_student_id\`), INDEX \`common_space_usage_order_d_club_id_club_id_fk\` (\`club_id\`), INDEX \`common_space_usage_order_d_common_space_id_common_space_id_fk\` (\`common_space_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_club_supplies_image_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`club_supplies_image_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_club_supplies_software_evidence_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`club_supplies_software_evidence_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_etc_expense_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`etc_expense_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_external_event_participation_fee_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`external_event_participation_fee_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_feedback\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`executive_id\` int NOT NULL, \`feedback\` text NOT NULL, \`funding_status_enum\` int NOT NULL, \`approved_amount\` int NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`funding_feedback_executive_id_fk\` (\`executive_id\`), INDEX \`funding_feedback_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_fixture_image_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`fixture_image_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_fixture_software_evidence_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`fixture_software_evidence_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_food_expense_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`food_expense_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_joint_expense_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`joint_expense_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_labor_contract_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`labor_contract_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_non_corporate_transaction_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`non_corporate_transaction_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_profit_making_activity_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`profit_making_activity_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_publication_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`publication_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_trade_detail_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`trade_detail_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_trade_evidence_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`file_id\` varchar(128) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`trade_evidence_file_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding\` (\`id\` int NOT NULL AUTO_INCREMENT, \`club_id\` int NOT NULL, \`activity_d_id\` int NOT NULL, \`funding_status_enum\` int NOT NULL DEFAULT '1', \`purpose_activity_id\` int NULL, \`name\` varchar(255) NOT NULL, \`expenditure_date\` datetime NOT NULL, \`expenditure_amount\` int NOT NULL, \`approved_amount\` int NULL, \`trade_detail_explanation\` text NULL, \`club_supplies_name\` varchar(255) NULL, \`club_supplies_evidence_enum\` int NULL, \`club_supplies_class_enum\` int NULL, \`club_supplies_purpose\` text NULL, \`club_supplies_software_evidence\` text NULL, \`number_of_club_supplies\` int NULL, \`price_of_club_supplies\` int NULL, \`is_fixture\` tinyint(1) NULL, \`fixture_name\` varchar(255) NULL, \`fixture_evidence_enum\` int NULL, \`fixture_class_enum\` int NULL, \`fixture_purpose\` text NULL, \`fixture_software_evidence\` text NULL, \`number_of_fixture\` int NULL, \`price_of_fixture\` int NULL, \`is_transportation\` tinyint(1) NOT NULL, \`transportation_enum\` int NULL, \`origin\` varchar(255) NULL, \`destination\` varchar(255) NULL, \`purpose_of_transportation\` text NULL, \`is_non_corporate_transaction\` tinyint(1) NOT NULL, \`trader_name\` varchar(255) NULL, \`trader_account_number\` varchar(255) NULL, \`waste_explanation\` text NULL, \`is_food_expense\` tinyint(1) NOT NULL, \`food_expense_explanation\` text NULL, \`is_labor_contract\` tinyint(1) NOT NULL, \`labor_contract_explanation\` text NULL, \`is_external_event_participation_fee\` tinyint(1) NOT NULL, \`external_event_participation_fee_explanation\` text NULL, \`is_publication\` tinyint(1) NOT NULL, \`publication_explanation\` text NULL, \`is_profit_making_activity\` tinyint(1) NOT NULL, \`profit_making_activity_explanation\` text NULL, \`is_joint_expense\` tinyint(1) NOT NULL, \`joint_expense_explanation\` text NULL, \`is_etc_expense\` tinyint(1) NOT NULL, \`etc_expense_explanation\` text NULL, \`charged_executive_id\` int NULL, \`edited_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`commented_at\` timestamp NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`funding_charged_executive_id_fk\` (\`charged_executive_id\`), INDEX \`funding_purpose_id_fk\` (\`purpose_activity_id\`), INDEX \`funding_club_id_fk\` (\`club_id\`), INDEX \`funding_activity_d_id_activity_d_id_fk\` (\`activity_d_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_transportation_passenger\` (\`id\` int NOT NULL AUTO_INCREMENT, \`funding_id\` int NOT NULL, \`student_id\` int NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`transportation_passenger_student_id_fk\` (\`student_id\`), INDEX \`transportation_passenger_funding_id_fk\` (\`funding_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`promotional_printing_order\` (\`id\` int NOT NULL AUTO_INCREMENT, \`club_id\` int NOT NULL, \`student_id\` int NOT NULL, \`student_phone_number\` varchar(30) NULL, \`promotional_printing_order_status_enum\` int NOT NULL, \`document_file_link\` text NULL, \`is_color_print\` tinyint(1) NOT NULL DEFAULT '1', \`fit_print_size_to_paper\` tinyint(1) NOT NULL DEFAULT '1', \`require_margin_chopping\` tinyint(1) NOT NULL DEFAULT '0', \`desired_pick_up_time\` datetime NOT NULL, \`pick_up_at\` datetime NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`promotional_printing_order_student_id_student_id_fk\` (\`student_id\`), INDEX \`promotional_printing_order_club_id_club_id_fk\` (\`club_id\`), INDEX \`pp_order_pp_order_status_enum_id_fk\` (\`promotional_printing_order_status_enum\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`rental_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type_name\` varchar(30) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`rental_object\` (\`id\` int NOT NULL AUTO_INCREMENT, \`rental_enum\` int NOT NULL, \`object_name\` varchar(30) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL, \`deleted_at\` timestamp NULL, INDEX \`rental_object_rental_enum_rental_enum_id_fk\` (\`rental_enum\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`rental_order_item_d\` (\`id\` int NOT NULL AUTO_INCREMENT, \`rental_order_id\` int NOT NULL, \`object_id\` int NOT NULL, \`start_term\` datetime NULL, \`end_term\` datetime NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL, \`deleted_at\` timestamp NULL, INDEX \`rental_order_item_d_object_id_rental_object_id_fk\` (\`object_id\`), INDEX \`rental_order_item_d_rental_order_id_rental_order_id_fk\` (\`rental_order_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`rental_order\` (\`id\` int NOT NULL AUTO_INCREMENT, \`student_id\` int NOT NULL, \`student_phone_number\` varchar(30) NULL, \`club_id\` int NOT NULL, \`purpose\` text NULL, \`desired_start\` datetime NOT NULL, \`desired_end\` datetime NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL, \`deleted_at\` timestamp NULL, INDEX \`rental_order_club_id_club_id_fk\` (\`club_id\`), INDEX \`rental_order_student_id_student_id_fk\` (\`student_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`student_t\` (\`id\` int NOT NULL AUTO_INCREMENT, \`student_id\` int NOT NULL, \`student_enum\` int NOT NULL, \`student_status_enum\` int NOT NULL, \`department\` int NULL, \`semester_id\` int NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, UNIQUE INDEX \`student_t_student_id_semester_id_unique_key\` (\`student_id\`, \`semester_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`student\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NULL, \`number\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`student_user_id_user_id_fk\` (\`user_id\`), UNIQUE INDEX \`student_number_unique\` (\`number\`), UNIQUE INDEX \`IDX_0d64718c33e3dcd860e8acb5ba\` (\`number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_certificate\` (\`id\` int NOT NULL AUTO_INCREMENT, \`club_id\` int NOT NULL, \`student_id\` int NOT NULL, \`student_phone_number\` varchar(30) NULL, \`activity_certificate_status_enum\` int NOT NULL, \`issue_number\` int NULL, \`issued_at\` datetime NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL, \`deleted_at\` timestamp NULL, INDEX \`activity_certificate_student_id_student_id_fk\` (\`student_id\`), INDEX \`activity_certificate_club_id_club_id_fk\` (\`club_id\`), INDEX \`activity_certificate_d_activity_certificate_enum_id_fk\` (\`activity_certificate_status_enum\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`division_permanent_club_d\` (\`id\` int NOT NULL AUTO_INCREMENT, \`club_id\` int NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, UNIQUE INDEX \`division_permanent_club_d_club_id_start_term_unique\` (\`club_id\`, \`start_term\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`club\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name_kr\` varchar(30) NOT NULL, \`name_en\` varchar(100) NOT NULL, \`division_id\` int NOT NULL, \`description\` text NULL, \`founding_year\` int NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`club_division_id_division_id_fk\` (\`division_id\`), UNIQUE INDEX \`club_name_en_unique\` (\`name_en\`), UNIQUE INDEX \`club_name_kr_unique\` (\`name_kr\`), UNIQUE INDEX \`IDX_2028bd39ec1b1e933d5fa75b6d\` (\`name_kr\`), UNIQUE INDEX \`IDX_03a1a873fd475f5ec158bb5027\` (\`name_en\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_club_charged_executive\` (\`id\` int NOT NULL AUTO_INCREMENT, \`activity_d_id\` int NOT NULL, \`club_id\` int NOT NULL, \`executive_id\` int NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`activity_club_charged_executive_executive_id_fk\` (\`executive_id\`), INDEX \`activity_club_charged_executive_club_id_fk\` (\`club_id\`), INDEX \`activity_club_charged_executive_activity_d_id_fk\` (\`activity_d_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_d\` (\`id\` int NOT NULL AUTO_INCREMENT, \`semester_id\` int NOT NULL, \`year\` int NOT NULL, \`name\` varchar(10) NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NOT NULL, \`activity_duration_type_enum\` int NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_evidence_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`activity_id\` int NOT NULL, \`file_id\` text NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`activity_evidence_file_activity_id_fk\` (\`activity_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_feedback\` (\`id\` int NOT NULL AUTO_INCREMENT, \`activity_id\` int NOT NULL, \`executive_id\` int NOT NULL, \`comment\` text NOT NULL, \`activity_status_enum\` int NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`activity_feedback_executive_id_executive_id_fk\` (\`executive_id\`), INDEX \`activity_feedback_activity_id_activity_id_fk\` (\`activity_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_status_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status_name\` varchar(255) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_t\` (\`id\` int NOT NULL AUTO_INCREMENT, \`activity_id\` int NOT NULL, \`start_term\` datetime NOT NULL, \`end_term\` datetime NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`activity_t_activity_id_activity_id_fk\` (\`activity_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`club_id\` int NOT NULL, \`original_name\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`activity_type_enum_id\` int NOT NULL, \`location\` varchar(255) NOT NULL, \`purpose\` text NOT NULL, \`detail\` text NOT NULL, \`evidence\` text NOT NULL, \`activity_d_id\` int NOT NULL, \`activity_status_enum_id\` int NOT NULL, \`charged_executive_id\` int NULL, \`professor_approved_at\` timestamp NULL, \`commented_at\` timestamp NULL, \`commented_executive_id\` int NULL, \`edited_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`activity_charged_executive_id_fk\` (\`charged_executive_id\`), INDEX \`activity_commented_executive_id_executive_id_fk\` (\`commented_executive_id\`), INDEX \`activity_activity_status_enum_id_activity_status_enum_id_fk\` (\`activity_status_enum_id\`), INDEX \`activity_activity_d_id_activity_d_id_fk\` (\`activity_d_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`executive_bureau_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(31) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`executive_status_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(30) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`executive_t\` (\`id\` int NOT NULL AUTO_INCREMENT, \`executive_id\` int NOT NULL, \`executive_status_enum\` int NOT NULL, \`executive_bureau_enum\` int NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`executive_t_executive_bureau_enum_executive_bureau_enum_id_fk\` (\`executive_bureau_enum\`), INDEX \`executive_t_executive_status_enum_executive_status_enum_id_fk\` (\`executive_status_enum\`), UNIQUE INDEX \`executive_t_executive_id_start_term_unique_key\` (\`executive_id\`, \`start_term\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`executive\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NULL, \`student_id\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`executive_user_id_user_id_fk\` (\`user_id\`), UNIQUE INDEX \`student_id_unique\` (\`student_id\`), UNIQUE INDEX \`IDX_6a08fb2d41091713e5f2fa85f0\` (\`student_id\`), UNIQUE INDEX \`REL_6a08fb2d41091713e5f2fa85f0\` (\`student_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`sid\` varchar(30) NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`phone_number\` varchar(30) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL, \`deleted_at\` timestamp NULL, UNIQUE INDEX \`user_sid_unique\` (\`sid\`), UNIQUE INDEX \`IDX_d0f652db5c9a1f26a83ffb1eb9\` (\`sid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_privacy_policy_agreement\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`user_privacy_policy_agreement_user_id_user_id_fk\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`student_status_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(30) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`student_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(30) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`promotional_printing_size_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`printing_size\` varchar(30) NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`promotional_printing_order_status_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status_name\` varchar(30) NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`promotional_printing_order_size\` (\`id\` int NOT NULL AUTO_INCREMENT, \`promotional_printing_order_id\` int NOT NULL, \`promotional_printing_size_enum_id\` int NOT NULL, \`number_of_prints\` int NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, INDEX \`pp_order_size_pp_size_enum_id_fk\` (\`promotional_printing_size_enum_id\`), INDEX \`pp_order_size_pp_order_id_fk\` (\`promotional_printing_order_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`professor_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(30) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`operation_committee\` (\`id\` int NOT NULL AUTO_INCREMENT, \`secret_key\` text NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`notice\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`author\` varchar(30) NOT NULL, \`date\` date NOT NULL, \`link\` varchar(255) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`article_id\` int NULL, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`funding_deadline_d\` (\`id\` int NOT NULL AUTO_INCREMENT, \`semester_id\` int NOT NULL, \`deadline_enum\` int NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`department\` (\`id\` int NOT NULL AUTO_INCREMENT, \`department_id\` int NULL, \`name\` varchar(255) NOT NULL, \`name_en\` varchar(255) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, UNIQUE INDEX \`department_department_id_unique\` (\`department_id\`), UNIQUE INDEX \`IDX_28a598987c3302c0b4dfc71f86\` (\`department_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`club_delegate_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`enum_name\` varchar(255) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_type_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type_name\` varchar(255) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_deadline_d\` (\`id\` int NOT NULL AUTO_INCREMENT, \`semester_id\` int NOT NULL, \`deadline_enum_id\` int NOT NULL, \`start_term\` date NOT NULL, \`end_term\` date NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_certificate_status_enum\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status_name\` varchar(30) NOT NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`deleted_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_certificate_item\` (\`id\` int NOT NULL AUTO_INCREMENT, \`activity_certificate_id\` int NOT NULL, \`order\` int NOT NULL, \`start_month\` date NOT NULL, \`end_month\` date NOT NULL, \`detail\` varchar(100) NULL, \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NULL, \`deleted_at\` timestamp NULL, INDEX \`activity_certificate_id_d_activity_certificate_id_enum_id_fk\` (\`activity_certificate_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`auth_activated_refresh_tokens\` ADD CONSTRAINT \`FK_5406335e9af154929cbd185763d\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`employee_t\` ADD CONSTRAINT \`FK_c3df18046e886ec92dc91631144\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employee\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`employee\` ADD CONSTRAINT \`FK_f61258e58ed35475ce1dba03797\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_participant\` ADD CONSTRAINT \`FK_5d88d380bfe60e28fcdcde9e12c\` FOREIGN KEY (\`activity_id\`) REFERENCES \`activity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_participant\` ADD CONSTRAINT \`FK_531460c81598e162b764e04d42c\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_delegate_change_request\` ADD CONSTRAINT \`FK_dc97a37d50605d604ef2826277d\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_delegate_change_request\` ADD CONSTRAINT \`FK_577ac6b3621f7ddc9f83361d718\` FOREIGN KEY (\`club_delegate_change_request_status_enum_id\`) REFERENCES \`club_delegate_change_request_status_enum\`(\`enum_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_delegate_change_request\` ADD CONSTRAINT \`FK_097426bd668bcce7a261bdf835b\` FOREIGN KEY (\`prev_student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_delegate_change_request\` ADD CONSTRAINT \`FK_114a03409613a4578e3ae1f13d4\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_delegate_d\` ADD CONSTRAINT \`FK_73b69ae44a9aad6cdea90cca9f4\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_delegate_d\` ADD CONSTRAINT \`FK_be39e6042d6afaaefde1ab0fc1c\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_room_t\` ADD CONSTRAINT \`FK_1cc713b2afbcbdb336d52695321\` FOREIGN KEY (\`club_building_enum\`) REFERENCES \`club_building_enum\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_room_t\` ADD CONSTRAINT \`FK_6575ee3759a531e23d077b6fe01\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_room_t\` ADD CONSTRAINT \`FK_410e9de6db1a0f5bdeed178cd36\` FOREIGN KEY (\`semester_id\`) REFERENCES \`semester_d\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`professor_t\` ADD CONSTRAINT \`FK_951d8f54dbea209bc083eb2296e\` FOREIGN KEY (\`professor_id\`) REFERENCES \`professor\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_division_t\` ADD CONSTRAINT \`FK_ae53883f46f0cde2d268d1fe542\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_division_t\` ADD CONSTRAINT \`FK_8375ac00ebd7969b828a3b4246e\` FOREIGN KEY (\`division_id\`) REFERENCES \`division\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`division_president_d\` ADD CONSTRAINT \`FK_e0752642b4f90ba77a325674ade\` FOREIGN KEY (\`division_id\`) REFERENCES \`division\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`division_president_d\` ADD CONSTRAINT \`FK_c5987c139fc8fbee594f74b0a54\` FOREIGN KEY (\`originated_club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`division_president_d\` ADD CONSTRAINT \`FK_1f03c132338c84011dc355ad216\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_time_t\` ADD CONSTRAINT \`FK_96c6011e06e39f068feb50598a7\` FOREIGN KEY (\`meeting_id\`) REFERENCES \`meeting\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_time_t\` ADD CONSTRAINT \`FK_0fee63e7a03fbb812972bf809cf\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_time_t\` ADD CONSTRAINT \`FK_96c6011e06e39f068feb50598a7\` FOREIGN KEY (\`meeting_id\`) REFERENCES \`meeting\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_time_t\` ADD CONSTRAINT \`FK_0fee63e7a03fbb812972bf809cf\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_vote_result\` ADD CONSTRAINT \`FK_c0af915e38923c074c4d9abbebf\` FOREIGN KEY (\`vote_id\`) REFERENCES \`meeting_agenda_vote\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_vote_result\` ADD CONSTRAINT \`FK_9b01a77f21d172bd0f44f557715\` FOREIGN KEY (\`choice_id\`) REFERENCES \`meeting_vote_choice\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_vote_result\` ADD CONSTRAINT \`FK_6161374c23acf7af586bfa7613a\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_vote_choice\` ADD CONSTRAINT \`FK_e0d73abe011d826cad308ae2f40\` FOREIGN KEY (\`vote_id\`) REFERENCES \`meeting_agenda_vote\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_mapping\` ADD CONSTRAINT \`FK_38cc6fac642f6ff51bdc84aeffd\` FOREIGN KEY (\`meeting_agenda_content_id\`) REFERENCES \`meeting_agenda_content\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_mapping\` ADD CONSTRAINT \`FK_0473964c7827dba72b3881d8c99\` FOREIGN KEY (\`meeting_agenda_id\`) REFERENCES \`meeting_agenda\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_mapping\` ADD CONSTRAINT \`FK_727366e9fda55003d271277b8ad\` FOREIGN KEY (\`meeting_agenda_vote_id\`) REFERENCES \`meeting_agenda_vote\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_mapping\` ADD CONSTRAINT \`FK_331fd98b3afb1195d7f79a25702\` FOREIGN KEY (\`meeting_id\`) REFERENCES \`meeting\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting\` ADD CONSTRAINT \`FK_860e0259c4fbbc9e6fccb1b8d37\` FOREIGN KEY (\`meeting_announcement_id\`) REFERENCES \`meeting_announcement\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_day\` ADD CONSTRAINT \`FK_40e0d877e84fe4ce7375d1080c6\` FOREIGN KEY (\`meeting_role_enum\`) REFERENCES \`meeting_role_enum\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_day\` ADD CONSTRAINT \`FK_c970cea580de6a4c5d5d5418fb4\` FOREIGN KEY (\`which_club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_day\` ADD CONSTRAINT \`FK_cc6fa8ecd35d3ba502fd61b0544\` FOREIGN KEY (\`which_division_id\`) REFERENCES \`division\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_day\` ADD CONSTRAINT \`FK_77c8068f234f2dc3bd08d648659\` FOREIGN KEY (\`meeting_id\`) REFERENCES \`meeting\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`division\` ADD CONSTRAINT \`FK_29ef41522ded7c8f3fba0954a44\` FOREIGN KEY (\`district_id\`) REFERENCES \`district\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`file\` ADD CONSTRAINT \`FK_516f1cf15166fd07b732b4b6ab0\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_executive_comment\` ADD CONSTRAINT \`FK_9a1f47a61197199da40efaa7d6a\` FOREIGN KEY (\`executive_id\`) REFERENCES \`executive\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_executive_comment\` ADD CONSTRAINT \`FK_ee70229f026b6549cf8e0bfcaa7\` FOREIGN KEY (\`registration_id\`) REFERENCES \`registration\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` ADD CONSTRAINT \`FK_0e06d27ea4a75287abea1d8cbe4\` FOREIGN KEY (\`registration_activity_plan_file_id\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` ADD CONSTRAINT \`FK_3ea7ab334e437a9b2081faa355c\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` ADD CONSTRAINT \`FK_ac2b45dcb1a2309cef4b65bcdd3\` FOREIGN KEY (\`registration_club_rule_file_id\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` ADD CONSTRAINT \`FK_9804721123cc7f9b72d935f502e\` FOREIGN KEY (\`division_id\`) REFERENCES \`division\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` ADD CONSTRAINT \`FK_6adc593d0e4eaf73f7f5096109f\` FOREIGN KEY (\`registration_external_instruction_file_id\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` ADD CONSTRAINT \`FK_909628179c2fb940dbb26bf6d39\` FOREIGN KEY (\`professor_id\`) REFERENCES \`professor\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` ADD CONSTRAINT \`FK_c893cb704b2c52b10f785442ffd\` FOREIGN KEY (\`registration_application_status_enum_id\`) REFERENCES \`registration_status_enum\`(\`enum_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` ADD CONSTRAINT \`FK_c69f181e75b708c70f2e9b944f7\` FOREIGN KEY (\`registration_application_type_enum_id\`) REFERENCES \`registration_type_enum\`(\`enum_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` ADD CONSTRAINT \`FK_07027713306f23e41450ee04864\` FOREIGN KEY (\`semester_d_id\`) REFERENCES \`semester_d\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` ADD CONSTRAINT \`FK_07027713306f23e41450ee04864\` FOREIGN KEY (\`semester_d_id\`) REFERENCES \`semester_d\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` ADD CONSTRAINT \`FK_8347b33f38c6ff467cb7774824b\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`professor\` ADD CONSTRAINT \`FK_cfed83451062b93f81929b406ba\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_t\` ADD CONSTRAINT \`FK_5bd78766c51142dfd97f4782571\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_t\` ADD CONSTRAINT \`FK_e00ab86a31782d7b24764a389a5\` FOREIGN KEY (\`club_status_enum_id\`) REFERENCES \`club_status_enum\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_t\` ADD CONSTRAINT \`FK_cf5301a06cc63a598668814bf58\` FOREIGN KEY (\`professor_id\`) REFERENCES \`professor\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_t\` ADD CONSTRAINT \`FK_98fd887d6abd548152780247bab\` FOREIGN KEY (\`semester_id\`) REFERENCES \`semester_d\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`professor_sign_status\` ADD CONSTRAINT \`FK_7e8971765919ee0e0f65f2ea2d7\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`professor_sign_status\` ADD CONSTRAINT \`FK_2dac12d72d299e6d2538fb99436\` FOREIGN KEY (\`semester_id\`) REFERENCES \`semester_d\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_application_student\` ADD CONSTRAINT \`FK_d143c376235f58ca3b610510709\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_application_student\` ADD CONSTRAINT \`FK_66bef347d8a4516be869d2550c7\` FOREIGN KEY (\`semester_d_id\`) REFERENCES \`semester_d\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_application_student\` ADD CONSTRAINT \`FK_32ea0e556f034aa6336e035c3a0\` FOREIGN KEY (\`registration_application_student_status_enum\`) REFERENCES \`registration_application_student_status_enum\`(\`enum_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_application_student\` ADD CONSTRAINT \`FK_7eb24e73dfd239a9f5a2bda3827\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_deadline_d\` ADD CONSTRAINT \`FK_e5120aa3e44405caa19073204ff\` FOREIGN KEY (\`semester_d_id\`) REFERENCES \`semester_d\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_student_t\` ADD CONSTRAINT \`FK_0b212b6714abb21483a94030f20\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_student_t\` ADD CONSTRAINT \`FK_1484443568d2f195b134c319645\` FOREIGN KEY (\`semester_id\`) REFERENCES \`semester_d\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_student_t\` ADD CONSTRAINT \`FK_c4a79d21217df6fb3f741d0e70e\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`common_space\` ADD CONSTRAINT \`FK_4f28372228e4b029a974dce8f4f\` FOREIGN KEY (\`common_space_enum\`) REFERENCES \`common_space_enum\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`common_space_usage_order_d\` ADD CONSTRAINT \`FK_1bd77cf88af31faed8bd8b11eef\` FOREIGN KEY (\`charge_student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`common_space_usage_order_d\` ADD CONSTRAINT \`FK_84c3e6850d2130fbff7ea8d6eac\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`common_space_usage_order_d\` ADD CONSTRAINT \`FK_4870489f3ec2e0e7395355c2497\` FOREIGN KEY (\`common_space_id\`) REFERENCES \`common_space\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_club_supplies_image_file\` ADD CONSTRAINT \`FK_eb334a24e6199658be8285f6575\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_club_supplies_software_evidence_file\` ADD CONSTRAINT \`FK_45e344bfddaf0d0a4c519c33076\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_etc_expense_file\` ADD CONSTRAINT \`FK_5703f4231fb373153918eeaa224\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_external_event_participation_fee_file\` ADD CONSTRAINT \`FK_0be795eaa4585ed1e00e99c813a\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_feedback\` ADD CONSTRAINT \`FK_72c265a9f72d1ba4a97e01f0524\` FOREIGN KEY (\`executive_id\`) REFERENCES \`executive\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_feedback\` ADD CONSTRAINT \`FK_027aae4812e6c44456905fa5492\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_fixture_image_file\` ADD CONSTRAINT \`FK_4218e94465d89872689f3285f4c\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_fixture_software_evidence_file\` ADD CONSTRAINT \`FK_0f2efefe27c466ccc14ebb3bde9\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_food_expense_file\` ADD CONSTRAINT \`FK_ac8d07f1dfa4d7801f9498cbe6a\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_joint_expense_file\` ADD CONSTRAINT \`FK_6dc4e128af334414d367c87b528\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_labor_contract_file\` ADD CONSTRAINT \`FK_b9243ef4c0b977b417fbe145d87\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_non_corporate_transaction_file\` ADD CONSTRAINT \`FK_2d01eac4b95bbc07a9365ac89ac\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_profit_making_activity_file\` ADD CONSTRAINT \`FK_ee4b5468d97df71b79e11c9c9fc\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_publication_file\` ADD CONSTRAINT \`FK_f4905d55640c29130e1a48b25e6\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_trade_detail_file\` ADD CONSTRAINT \`FK_aefc6bb98b307b7e4b63977c2c8\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_trade_evidence_file\` ADD CONSTRAINT \`FK_4eca180a8f3beb9dbf4a18036b6\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding\` ADD CONSTRAINT \`FK_60a5a8602413b3e622b906e6dad\` FOREIGN KEY (\`activity_d_id\`) REFERENCES \`activity_d\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding\` ADD CONSTRAINT \`FK_a23d6e173aacfe6d1ad362af7ca\` FOREIGN KEY (\`charged_executive_id\`) REFERENCES \`executive\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding\` ADD CONSTRAINT \`FK_a5487ff995dba2bfdf404c0a832\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding\` ADD CONSTRAINT \`FK_ae9a479ceeb9eb54b98e0b605d4\` FOREIGN KEY (\`purpose_activity_id\`) REFERENCES \`activity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_transportation_passenger\` ADD CONSTRAINT \`FK_d171c935b08b3b6ad9bff417d20\` FOREIGN KEY (\`funding_id\`) REFERENCES \`funding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_transportation_passenger\` ADD CONSTRAINT \`FK_a4760040183dfaeab871877fcf5\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`promotional_printing_order\` ADD CONSTRAINT \`FK_f8e8ff578965727e9f44ee4f633\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`promotional_printing_order\` ADD CONSTRAINT \`FK_acfe1d8e3877e694f2b0341ea06\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`rental_object\` ADD CONSTRAINT \`FK_76dee015e8f911f5704a7276505\` FOREIGN KEY (\`rental_enum\`) REFERENCES \`rental_enum\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`rental_order_item_d\` ADD CONSTRAINT \`FK_ecf332ebf3dc30ddb1e41ef3cdc\` FOREIGN KEY (\`object_id\`) REFERENCES \`rental_object\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`rental_order_item_d\` ADD CONSTRAINT \`FK_2912f2d9d54d52cafad9192c693\` FOREIGN KEY (\`rental_order_id\`) REFERENCES \`rental_order\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`rental_order\` ADD CONSTRAINT \`FK_00870bcd9b0db2fe8e16091bf66\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`rental_order\` ADD CONSTRAINT \`FK_d5e269e1e97910258dc1871c3a1\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_t\` ADD CONSTRAINT \`FK_cf53c709e849696a0469c8a7f11\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`student\` ADD CONSTRAINT \`FK_0cc43638ebcf41dfab27e62dc09\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_certificate\` ADD CONSTRAINT \`FK_ef99316fe8532a743930b88531b\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_certificate\` ADD CONSTRAINT \`FK_9b7dac54482cd9fc6056da3c6f0\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`division_permanent_club_d\` ADD CONSTRAINT \`FK_225bd2ce57ab06a3d2287e267da\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`club\` ADD CONSTRAINT \`FK_5cd5a08cc1262b98efca891df86\` FOREIGN KEY (\`division_id\`) REFERENCES \`division\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_club_charged_executive\` ADD CONSTRAINT \`FK_05558294704d16b7da584051334\` FOREIGN KEY (\`activity_d_id\`) REFERENCES \`activity_d\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_club_charged_executive\` ADD CONSTRAINT \`FK_df2666896e928d424114c1f77be\` FOREIGN KEY (\`club_id\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_club_charged_executive\` ADD CONSTRAINT \`FK_6315d11125062f7655f856533c1\` FOREIGN KEY (\`executive_id\`) REFERENCES \`executive\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_evidence_file\` ADD CONSTRAINT \`FK_dc407b81c6b2dec2e72068f7357\` FOREIGN KEY (\`activity_id\`) REFERENCES \`activity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_feedback\` ADD CONSTRAINT \`FK_114a3b8ae30a63ae275700c90cf\` FOREIGN KEY (\`activity_id\`) REFERENCES \`activity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_feedback\` ADD CONSTRAINT \`FK_9b4598a9158a1aa80c25513696e\` FOREIGN KEY (\`executive_id\`) REFERENCES \`executive\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_t\` ADD CONSTRAINT \`FK_69c755b88fbd67935aef60d9d67\` FOREIGN KEY (\`activity_id\`) REFERENCES \`activity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity\` ADD CONSTRAINT \`FK_6bfcefec00f3bc5f0cf5da5bdeb\` FOREIGN KEY (\`activity_d_id\`) REFERENCES \`activity_d\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity\` ADD CONSTRAINT \`FK_f163d2c6b03f778fdfff044d144\` FOREIGN KEY (\`activity_status_enum_id\`) REFERENCES \`activity_status_enum\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity\` ADD CONSTRAINT \`FK_08f2f111ab010c7d4b225246d61\` FOREIGN KEY (\`charged_executive_id\`) REFERENCES \`executive\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity\` ADD CONSTRAINT \`FK_08f2f111ab010c7d4b225246d61\` FOREIGN KEY (\`charged_executive_id\`) REFERENCES \`executive\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity\` ADD CONSTRAINT \`FK_9e3fada8f2bbbcaf4ddc5cd3aae\` FOREIGN KEY (\`commented_executive_id\`) REFERENCES \`executive\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`executive_t\` ADD CONSTRAINT \`FK_08a5bf58d453c1de30fbf239e6f\` FOREIGN KEY (\`executive_bureau_enum\`) REFERENCES \`executive_bureau_enum\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`executive_t\` ADD CONSTRAINT \`FK_ba465b8c2e7555c5500802e9949\` FOREIGN KEY (\`executive_id\`) REFERENCES \`executive\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`executive_t\` ADD CONSTRAINT \`FK_094e51ed49729e6612ad2af0479\` FOREIGN KEY (\`executive_status_enum\`) REFERENCES \`executive_status_enum\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`executive\` ADD CONSTRAINT \`FK_6a08fb2d41091713e5f2fa85f03\` FOREIGN KEY (\`student_id\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`executive\` ADD CONSTRAINT \`FK_c9018c617069c6bc266533c0071\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_privacy_policy_agreement\` ADD CONSTRAINT \`FK_23dfad4421931fe9bfb94438571\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_privacy_policy_agreement\` DROP FOREIGN KEY \`FK_23dfad4421931fe9bfb94438571\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`executive\` DROP FOREIGN KEY \`FK_c9018c617069c6bc266533c0071\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`executive\` DROP FOREIGN KEY \`FK_6a08fb2d41091713e5f2fa85f03\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`executive_t\` DROP FOREIGN KEY \`FK_094e51ed49729e6612ad2af0479\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`executive_t\` DROP FOREIGN KEY \`FK_ba465b8c2e7555c5500802e9949\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`executive_t\` DROP FOREIGN KEY \`FK_08a5bf58d453c1de30fbf239e6f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity\` DROP FOREIGN KEY \`FK_9e3fada8f2bbbcaf4ddc5cd3aae\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity\` DROP FOREIGN KEY \`FK_08f2f111ab010c7d4b225246d61\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity\` DROP FOREIGN KEY \`FK_08f2f111ab010c7d4b225246d61\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity\` DROP FOREIGN KEY \`FK_f163d2c6b03f778fdfff044d144\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity\` DROP FOREIGN KEY \`FK_6bfcefec00f3bc5f0cf5da5bdeb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_t\` DROP FOREIGN KEY \`FK_69c755b88fbd67935aef60d9d67\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_feedback\` DROP FOREIGN KEY \`FK_9b4598a9158a1aa80c25513696e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_feedback\` DROP FOREIGN KEY \`FK_114a3b8ae30a63ae275700c90cf\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_evidence_file\` DROP FOREIGN KEY \`FK_dc407b81c6b2dec2e72068f7357\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_club_charged_executive\` DROP FOREIGN KEY \`FK_6315d11125062f7655f856533c1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_club_charged_executive\` DROP FOREIGN KEY \`FK_df2666896e928d424114c1f77be\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_club_charged_executive\` DROP FOREIGN KEY \`FK_05558294704d16b7da584051334\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club\` DROP FOREIGN KEY \`FK_5cd5a08cc1262b98efca891df86\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`division_permanent_club_d\` DROP FOREIGN KEY \`FK_225bd2ce57ab06a3d2287e267da\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_certificate\` DROP FOREIGN KEY \`FK_9b7dac54482cd9fc6056da3c6f0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_certificate\` DROP FOREIGN KEY \`FK_ef99316fe8532a743930b88531b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`student\` DROP FOREIGN KEY \`FK_0cc43638ebcf41dfab27e62dc09\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_t\` DROP FOREIGN KEY \`FK_cf53c709e849696a0469c8a7f11\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`rental_order\` DROP FOREIGN KEY \`FK_d5e269e1e97910258dc1871c3a1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`rental_order\` DROP FOREIGN KEY \`FK_00870bcd9b0db2fe8e16091bf66\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`rental_order_item_d\` DROP FOREIGN KEY \`FK_2912f2d9d54d52cafad9192c693\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`rental_order_item_d\` DROP FOREIGN KEY \`FK_ecf332ebf3dc30ddb1e41ef3cdc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`rental_object\` DROP FOREIGN KEY \`FK_76dee015e8f911f5704a7276505\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`promotional_printing_order\` DROP FOREIGN KEY \`FK_acfe1d8e3877e694f2b0341ea06\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`promotional_printing_order\` DROP FOREIGN KEY \`FK_f8e8ff578965727e9f44ee4f633\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_transportation_passenger\` DROP FOREIGN KEY \`FK_a4760040183dfaeab871877fcf5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_transportation_passenger\` DROP FOREIGN KEY \`FK_d171c935b08b3b6ad9bff417d20\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding\` DROP FOREIGN KEY \`FK_ae9a479ceeb9eb54b98e0b605d4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding\` DROP FOREIGN KEY \`FK_a5487ff995dba2bfdf404c0a832\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding\` DROP FOREIGN KEY \`FK_a23d6e173aacfe6d1ad362af7ca\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding\` DROP FOREIGN KEY \`FK_60a5a8602413b3e622b906e6dad\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_trade_evidence_file\` DROP FOREIGN KEY \`FK_4eca180a8f3beb9dbf4a18036b6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_trade_detail_file\` DROP FOREIGN KEY \`FK_aefc6bb98b307b7e4b63977c2c8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_publication_file\` DROP FOREIGN KEY \`FK_f4905d55640c29130e1a48b25e6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_profit_making_activity_file\` DROP FOREIGN KEY \`FK_ee4b5468d97df71b79e11c9c9fc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_non_corporate_transaction_file\` DROP FOREIGN KEY \`FK_2d01eac4b95bbc07a9365ac89ac\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_labor_contract_file\` DROP FOREIGN KEY \`FK_b9243ef4c0b977b417fbe145d87\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_joint_expense_file\` DROP FOREIGN KEY \`FK_6dc4e128af334414d367c87b528\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_food_expense_file\` DROP FOREIGN KEY \`FK_ac8d07f1dfa4d7801f9498cbe6a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_fixture_software_evidence_file\` DROP FOREIGN KEY \`FK_0f2efefe27c466ccc14ebb3bde9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_fixture_image_file\` DROP FOREIGN KEY \`FK_4218e94465d89872689f3285f4c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_feedback\` DROP FOREIGN KEY \`FK_027aae4812e6c44456905fa5492\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_feedback\` DROP FOREIGN KEY \`FK_72c265a9f72d1ba4a97e01f0524\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_external_event_participation_fee_file\` DROP FOREIGN KEY \`FK_0be795eaa4585ed1e00e99c813a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_etc_expense_file\` DROP FOREIGN KEY \`FK_5703f4231fb373153918eeaa224\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_club_supplies_software_evidence_file\` DROP FOREIGN KEY \`FK_45e344bfddaf0d0a4c519c33076\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`funding_club_supplies_image_file\` DROP FOREIGN KEY \`FK_eb334a24e6199658be8285f6575\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`common_space_usage_order_d\` DROP FOREIGN KEY \`FK_4870489f3ec2e0e7395355c2497\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`common_space_usage_order_d\` DROP FOREIGN KEY \`FK_84c3e6850d2130fbff7ea8d6eac\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`common_space_usage_order_d\` DROP FOREIGN KEY \`FK_1bd77cf88af31faed8bd8b11eef\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`common_space\` DROP FOREIGN KEY \`FK_4f28372228e4b029a974dce8f4f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_student_t\` DROP FOREIGN KEY \`FK_c4a79d21217df6fb3f741d0e70e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_student_t\` DROP FOREIGN KEY \`FK_1484443568d2f195b134c319645\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_student_t\` DROP FOREIGN KEY \`FK_0b212b6714abb21483a94030f20\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_deadline_d\` DROP FOREIGN KEY \`FK_e5120aa3e44405caa19073204ff\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_application_student\` DROP FOREIGN KEY \`FK_7eb24e73dfd239a9f5a2bda3827\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_application_student\` DROP FOREIGN KEY \`FK_32ea0e556f034aa6336e035c3a0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_application_student\` DROP FOREIGN KEY \`FK_66bef347d8a4516be869d2550c7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_application_student\` DROP FOREIGN KEY \`FK_d143c376235f58ca3b610510709\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`professor_sign_status\` DROP FOREIGN KEY \`FK_2dac12d72d299e6d2538fb99436\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`professor_sign_status\` DROP FOREIGN KEY \`FK_7e8971765919ee0e0f65f2ea2d7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_t\` DROP FOREIGN KEY \`FK_98fd887d6abd548152780247bab\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_t\` DROP FOREIGN KEY \`FK_cf5301a06cc63a598668814bf58\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_t\` DROP FOREIGN KEY \`FK_e00ab86a31782d7b24764a389a5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_t\` DROP FOREIGN KEY \`FK_5bd78766c51142dfd97f4782571\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`professor\` DROP FOREIGN KEY \`FK_cfed83451062b93f81929b406ba\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` DROP FOREIGN KEY \`FK_8347b33f38c6ff467cb7774824b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` DROP FOREIGN KEY \`FK_07027713306f23e41450ee04864\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` DROP FOREIGN KEY \`FK_07027713306f23e41450ee04864\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` DROP FOREIGN KEY \`FK_c69f181e75b708c70f2e9b944f7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` DROP FOREIGN KEY \`FK_c893cb704b2c52b10f785442ffd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` DROP FOREIGN KEY \`FK_909628179c2fb940dbb26bf6d39\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` DROP FOREIGN KEY \`FK_6adc593d0e4eaf73f7f5096109f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` DROP FOREIGN KEY \`FK_9804721123cc7f9b72d935f502e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` DROP FOREIGN KEY \`FK_ac2b45dcb1a2309cef4b65bcdd3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` DROP FOREIGN KEY \`FK_3ea7ab334e437a9b2081faa355c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration\` DROP FOREIGN KEY \`FK_0e06d27ea4a75287abea1d8cbe4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_executive_comment\` DROP FOREIGN KEY \`FK_ee70229f026b6549cf8e0bfcaa7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registration_executive_comment\` DROP FOREIGN KEY \`FK_9a1f47a61197199da40efaa7d6a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`file\` DROP FOREIGN KEY \`FK_516f1cf15166fd07b732b4b6ab0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`division\` DROP FOREIGN KEY \`FK_29ef41522ded7c8f3fba0954a44\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_day\` DROP FOREIGN KEY \`FK_77c8068f234f2dc3bd08d648659\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_day\` DROP FOREIGN KEY \`FK_cc6fa8ecd35d3ba502fd61b0544\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_day\` DROP FOREIGN KEY \`FK_c970cea580de6a4c5d5d5418fb4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_day\` DROP FOREIGN KEY \`FK_40e0d877e84fe4ce7375d1080c6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting\` DROP FOREIGN KEY \`FK_860e0259c4fbbc9e6fccb1b8d37\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_mapping\` DROP FOREIGN KEY \`FK_331fd98b3afb1195d7f79a25702\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_mapping\` DROP FOREIGN KEY \`FK_727366e9fda55003d271277b8ad\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_mapping\` DROP FOREIGN KEY \`FK_0473964c7827dba72b3881d8c99\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_mapping\` DROP FOREIGN KEY \`FK_38cc6fac642f6ff51bdc84aeffd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_vote_choice\` DROP FOREIGN KEY \`FK_e0d73abe011d826cad308ae2f40\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_vote_result\` DROP FOREIGN KEY \`FK_6161374c23acf7af586bfa7613a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_vote_result\` DROP FOREIGN KEY \`FK_9b01a77f21d172bd0f44f557715\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_vote_result\` DROP FOREIGN KEY \`FK_c0af915e38923c074c4d9abbebf\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_time_t\` DROP FOREIGN KEY \`FK_0fee63e7a03fbb812972bf809cf\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_time_t\` DROP FOREIGN KEY \`FK_96c6011e06e39f068feb50598a7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_time_t\` DROP FOREIGN KEY \`FK_0fee63e7a03fbb812972bf809cf\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meeting_attendance_time_t\` DROP FOREIGN KEY \`FK_96c6011e06e39f068feb50598a7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`division_president_d\` DROP FOREIGN KEY \`FK_1f03c132338c84011dc355ad216\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`division_president_d\` DROP FOREIGN KEY \`FK_c5987c139fc8fbee594f74b0a54\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`division_president_d\` DROP FOREIGN KEY \`FK_e0752642b4f90ba77a325674ade\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_division_t\` DROP FOREIGN KEY \`FK_8375ac00ebd7969b828a3b4246e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_division_t\` DROP FOREIGN KEY \`FK_ae53883f46f0cde2d268d1fe542\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`professor_t\` DROP FOREIGN KEY \`FK_951d8f54dbea209bc083eb2296e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_room_t\` DROP FOREIGN KEY \`FK_410e9de6db1a0f5bdeed178cd36\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_room_t\` DROP FOREIGN KEY \`FK_6575ee3759a531e23d077b6fe01\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_room_t\` DROP FOREIGN KEY \`FK_1cc713b2afbcbdb336d52695321\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_delegate_d\` DROP FOREIGN KEY \`FK_be39e6042d6afaaefde1ab0fc1c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_delegate_d\` DROP FOREIGN KEY \`FK_73b69ae44a9aad6cdea90cca9f4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_delegate_change_request\` DROP FOREIGN KEY \`FK_114a03409613a4578e3ae1f13d4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_delegate_change_request\` DROP FOREIGN KEY \`FK_097426bd668bcce7a261bdf835b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_delegate_change_request\` DROP FOREIGN KEY \`FK_577ac6b3621f7ddc9f83361d718\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`club_delegate_change_request\` DROP FOREIGN KEY \`FK_dc97a37d50605d604ef2826277d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_participant\` DROP FOREIGN KEY \`FK_531460c81598e162b764e04d42c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_participant\` DROP FOREIGN KEY \`FK_5d88d380bfe60e28fcdcde9e12c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`employee\` DROP FOREIGN KEY \`FK_f61258e58ed35475ce1dba03797\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`employee_t\` DROP FOREIGN KEY \`FK_c3df18046e886ec92dc91631144\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`auth_activated_refresh_tokens\` DROP FOREIGN KEY \`FK_5406335e9af154929cbd185763d\``,
    );
    await queryRunner.query(
      `DROP INDEX \`activity_certificate_id_d_activity_certificate_id_enum_id_fk\` ON \`activity_certificate_item\``,
    );
    await queryRunner.query(`DROP TABLE \`activity_certificate_item\``);
    await queryRunner.query(`DROP TABLE \`activity_certificate_status_enum\``);
    await queryRunner.query(`DROP TABLE \`activity_deadline_d\``);
    await queryRunner.query(`DROP TABLE \`activity_type_enum\``);
    await queryRunner.query(`DROP TABLE \`club_delegate_enum\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_28a598987c3302c0b4dfc71f86\` ON \`department\``,
    );
    await queryRunner.query(
      `DROP INDEX \`department_department_id_unique\` ON \`department\``,
    );
    await queryRunner.query(`DROP TABLE \`department\``);
    await queryRunner.query(`DROP TABLE \`funding_deadline_d\``);
    await queryRunner.query(`DROP TABLE \`notice\``);
    await queryRunner.query(`DROP TABLE \`operation_committee\``);
    await queryRunner.query(`DROP TABLE \`professor_enum\``);
    await queryRunner.query(
      `DROP INDEX \`pp_order_size_pp_order_id_fk\` ON \`promotional_printing_order_size\``,
    );
    await queryRunner.query(
      `DROP INDEX \`pp_order_size_pp_size_enum_id_fk\` ON \`promotional_printing_order_size\``,
    );
    await queryRunner.query(`DROP TABLE \`promotional_printing_order_size\``);
    await queryRunner.query(
      `DROP TABLE \`promotional_printing_order_status_enum\``,
    );
    await queryRunner.query(`DROP TABLE \`promotional_printing_size_enum\``);
    await queryRunner.query(`DROP TABLE \`student_enum\``);
    await queryRunner.query(`DROP TABLE \`student_status_enum\``);
    await queryRunner.query(
      `DROP INDEX \`user_privacy_policy_agreement_user_id_user_id_fk\` ON \`user_privacy_policy_agreement\``,
    );
    await queryRunner.query(`DROP TABLE \`user_privacy_policy_agreement\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_d0f652db5c9a1f26a83ffb1eb9\` ON \`user\``,
    );
    await queryRunner.query(`DROP INDEX \`user_sid_unique\` ON \`user\``);
    await queryRunner.query(`DROP TABLE \`user\``);
    await queryRunner.query(
      `DROP INDEX \`REL_6a08fb2d41091713e5f2fa85f0\` ON \`executive\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_6a08fb2d41091713e5f2fa85f0\` ON \`executive\``,
    );
    await queryRunner.query(
      `DROP INDEX \`student_id_unique\` ON \`executive\``,
    );
    await queryRunner.query(
      `DROP INDEX \`executive_user_id_user_id_fk\` ON \`executive\``,
    );
    await queryRunner.query(`DROP TABLE \`executive\``);
    await queryRunner.query(
      `DROP INDEX \`executive_t_executive_id_start_term_unique_key\` ON \`executive_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`executive_t_executive_status_enum_executive_status_enum_id_fk\` ON \`executive_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`executive_t_executive_bureau_enum_executive_bureau_enum_id_fk\` ON \`executive_t\``,
    );
    await queryRunner.query(`DROP TABLE \`executive_t\``);
    await queryRunner.query(`DROP TABLE \`executive_status_enum\``);
    await queryRunner.query(`DROP TABLE \`executive_bureau_enum\``);
    await queryRunner.query(
      `DROP INDEX \`activity_activity_d_id_activity_d_id_fk\` ON \`activity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`activity_activity_status_enum_id_activity_status_enum_id_fk\` ON \`activity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`activity_commented_executive_id_executive_id_fk\` ON \`activity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`activity_charged_executive_id_fk\` ON \`activity\``,
    );
    await queryRunner.query(`DROP TABLE \`activity\``);
    await queryRunner.query(
      `DROP INDEX \`activity_t_activity_id_activity_id_fk\` ON \`activity_t\``,
    );
    await queryRunner.query(`DROP TABLE \`activity_t\``);
    await queryRunner.query(`DROP TABLE \`activity_status_enum\``);
    await queryRunner.query(
      `DROP INDEX \`activity_feedback_activity_id_activity_id_fk\` ON \`activity_feedback\``,
    );
    await queryRunner.query(
      `DROP INDEX \`activity_feedback_executive_id_executive_id_fk\` ON \`activity_feedback\``,
    );
    await queryRunner.query(`DROP TABLE \`activity_feedback\``);
    await queryRunner.query(
      `DROP INDEX \`activity_evidence_file_activity_id_fk\` ON \`activity_evidence_file\``,
    );
    await queryRunner.query(`DROP TABLE \`activity_evidence_file\``);
    await queryRunner.query(`DROP TABLE \`activity_d\``);
    await queryRunner.query(
      `DROP INDEX \`activity_club_charged_executive_activity_d_id_fk\` ON \`activity_club_charged_executive\``,
    );
    await queryRunner.query(
      `DROP INDEX \`activity_club_charged_executive_club_id_fk\` ON \`activity_club_charged_executive\``,
    );
    await queryRunner.query(
      `DROP INDEX \`activity_club_charged_executive_executive_id_fk\` ON \`activity_club_charged_executive\``,
    );
    await queryRunner.query(`DROP TABLE \`activity_club_charged_executive\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_03a1a873fd475f5ec158bb5027\` ON \`club\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_2028bd39ec1b1e933d5fa75b6d\` ON \`club\``,
    );
    await queryRunner.query(`DROP INDEX \`club_name_kr_unique\` ON \`club\``);
    await queryRunner.query(`DROP INDEX \`club_name_en_unique\` ON \`club\``);
    await queryRunner.query(
      `DROP INDEX \`club_division_id_division_id_fk\` ON \`club\``,
    );
    await queryRunner.query(`DROP TABLE \`club\``);
    await queryRunner.query(
      `DROP INDEX \`division_permanent_club_d_club_id_start_term_unique\` ON \`division_permanent_club_d\``,
    );
    await queryRunner.query(`DROP TABLE \`division_permanent_club_d\``);
    await queryRunner.query(
      `DROP INDEX \`activity_certificate_d_activity_certificate_enum_id_fk\` ON \`activity_certificate\``,
    );
    await queryRunner.query(
      `DROP INDEX \`activity_certificate_club_id_club_id_fk\` ON \`activity_certificate\``,
    );
    await queryRunner.query(
      `DROP INDEX \`activity_certificate_student_id_student_id_fk\` ON \`activity_certificate\``,
    );
    await queryRunner.query(`DROP TABLE \`activity_certificate\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_0d64718c33e3dcd860e8acb5ba\` ON \`student\``,
    );
    await queryRunner.query(
      `DROP INDEX \`student_number_unique\` ON \`student\``,
    );
    await queryRunner.query(
      `DROP INDEX \`student_user_id_user_id_fk\` ON \`student\``,
    );
    await queryRunner.query(`DROP TABLE \`student\``);
    await queryRunner.query(
      `DROP INDEX \`student_t_student_id_semester_id_unique_key\` ON \`student_t\``,
    );
    await queryRunner.query(`DROP TABLE \`student_t\``);
    await queryRunner.query(
      `DROP INDEX \`rental_order_student_id_student_id_fk\` ON \`rental_order\``,
    );
    await queryRunner.query(
      `DROP INDEX \`rental_order_club_id_club_id_fk\` ON \`rental_order\``,
    );
    await queryRunner.query(`DROP TABLE \`rental_order\``);
    await queryRunner.query(
      `DROP INDEX \`rental_order_item_d_rental_order_id_rental_order_id_fk\` ON \`rental_order_item_d\``,
    );
    await queryRunner.query(
      `DROP INDEX \`rental_order_item_d_object_id_rental_object_id_fk\` ON \`rental_order_item_d\``,
    );
    await queryRunner.query(`DROP TABLE \`rental_order_item_d\``);
    await queryRunner.query(
      `DROP INDEX \`rental_object_rental_enum_rental_enum_id_fk\` ON \`rental_object\``,
    );
    await queryRunner.query(`DROP TABLE \`rental_object\``);
    await queryRunner.query(`DROP TABLE \`rental_enum\``);
    await queryRunner.query(
      `DROP INDEX \`pp_order_pp_order_status_enum_id_fk\` ON \`promotional_printing_order\``,
    );
    await queryRunner.query(
      `DROP INDEX \`promotional_printing_order_club_id_club_id_fk\` ON \`promotional_printing_order\``,
    );
    await queryRunner.query(
      `DROP INDEX \`promotional_printing_order_student_id_student_id_fk\` ON \`promotional_printing_order\``,
    );
    await queryRunner.query(`DROP TABLE \`promotional_printing_order\``);
    await queryRunner.query(
      `DROP INDEX \`transportation_passenger_funding_id_fk\` ON \`funding_transportation_passenger\``,
    );
    await queryRunner.query(
      `DROP INDEX \`transportation_passenger_student_id_fk\` ON \`funding_transportation_passenger\``,
    );
    await queryRunner.query(`DROP TABLE \`funding_transportation_passenger\``);
    await queryRunner.query(
      `DROP INDEX \`funding_activity_d_id_activity_d_id_fk\` ON \`funding\``,
    );
    await queryRunner.query(`DROP INDEX \`funding_club_id_fk\` ON \`funding\``);
    await queryRunner.query(
      `DROP INDEX \`funding_purpose_id_fk\` ON \`funding\``,
    );
    await queryRunner.query(
      `DROP INDEX \`funding_charged_executive_id_fk\` ON \`funding\``,
    );
    await queryRunner.query(`DROP TABLE \`funding\``);
    await queryRunner.query(
      `DROP INDEX \`trade_evidence_file_funding_id_fk\` ON \`funding_trade_evidence_file\``,
    );
    await queryRunner.query(`DROP TABLE \`funding_trade_evidence_file\``);
    await queryRunner.query(
      `DROP INDEX \`trade_detail_file_funding_id_fk\` ON \`funding_trade_detail_file\``,
    );
    await queryRunner.query(`DROP TABLE \`funding_trade_detail_file\``);
    await queryRunner.query(
      `DROP INDEX \`publication_file_funding_id_fk\` ON \`funding_publication_file\``,
    );
    await queryRunner.query(`DROP TABLE \`funding_publication_file\``);
    await queryRunner.query(
      `DROP INDEX \`profit_making_activity_file_funding_id_fk\` ON \`funding_profit_making_activity_file\``,
    );
    await queryRunner.query(
      `DROP TABLE \`funding_profit_making_activity_file\``,
    );
    await queryRunner.query(
      `DROP INDEX \`non_corporate_transaction_file_funding_id_fk\` ON \`funding_non_corporate_transaction_file\``,
    );
    await queryRunner.query(
      `DROP TABLE \`funding_non_corporate_transaction_file\``,
    );
    await queryRunner.query(
      `DROP INDEX \`labor_contract_file_funding_id_fk\` ON \`funding_labor_contract_file\``,
    );
    await queryRunner.query(`DROP TABLE \`funding_labor_contract_file\``);
    await queryRunner.query(
      `DROP INDEX \`joint_expense_file_funding_id_fk\` ON \`funding_joint_expense_file\``,
    );
    await queryRunner.query(`DROP TABLE \`funding_joint_expense_file\``);
    await queryRunner.query(
      `DROP INDEX \`food_expense_file_funding_id_fk\` ON \`funding_food_expense_file\``,
    );
    await queryRunner.query(`DROP TABLE \`funding_food_expense_file\``);
    await queryRunner.query(
      `DROP INDEX \`fixture_software_evidence_file_funding_id_fk\` ON \`funding_fixture_software_evidence_file\``,
    );
    await queryRunner.query(
      `DROP TABLE \`funding_fixture_software_evidence_file\``,
    );
    await queryRunner.query(
      `DROP INDEX \`fixture_image_file_funding_id_fk\` ON \`funding_fixture_image_file\``,
    );
    await queryRunner.query(`DROP TABLE \`funding_fixture_image_file\``);
    await queryRunner.query(
      `DROP INDEX \`funding_feedback_funding_id_fk\` ON \`funding_feedback\``,
    );
    await queryRunner.query(
      `DROP INDEX \`funding_feedback_executive_id_fk\` ON \`funding_feedback\``,
    );
    await queryRunner.query(`DROP TABLE \`funding_feedback\``);
    await queryRunner.query(
      `DROP INDEX \`external_event_participation_fee_file_funding_id_fk\` ON \`funding_external_event_participation_fee_file\``,
    );
    await queryRunner.query(
      `DROP TABLE \`funding_external_event_participation_fee_file\``,
    );
    await queryRunner.query(
      `DROP INDEX \`etc_expense_file_funding_id_fk\` ON \`funding_etc_expense_file\``,
    );
    await queryRunner.query(`DROP TABLE \`funding_etc_expense_file\``);
    await queryRunner.query(
      `DROP INDEX \`club_supplies_software_evidence_file_funding_id_fk\` ON \`funding_club_supplies_software_evidence_file\``,
    );
    await queryRunner.query(
      `DROP TABLE \`funding_club_supplies_software_evidence_file\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_supplies_image_file_funding_id_fk\` ON \`funding_club_supplies_image_file\``,
    );
    await queryRunner.query(`DROP TABLE \`funding_club_supplies_image_file\``);
    await queryRunner.query(
      `DROP INDEX \`common_space_usage_order_d_common_space_id_common_space_id_fk\` ON \`common_space_usage_order_d\``,
    );
    await queryRunner.query(
      `DROP INDEX \`common_space_usage_order_d_club_id_club_id_fk\` ON \`common_space_usage_order_d\``,
    );
    await queryRunner.query(
      `DROP INDEX \`common_space_usage_order_d_charge_student_id_student_id_fk\` ON \`common_space_usage_order_d\``,
    );
    await queryRunner.query(`DROP TABLE \`common_space_usage_order_d\``);
    await queryRunner.query(
      `DROP INDEX \`common_space_common_space_enum_common_space_enum_id_fk\` ON \`common_space\``,
    );
    await queryRunner.query(`DROP TABLE \`common_space\``);
    await queryRunner.query(`DROP TABLE \`common_space_enum\``);
    await queryRunner.query(
      `DROP INDEX \`club_student_t_student_id_student_id_fk\` ON \`club_student_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_student_t_club_id_club_id_fk\` ON \`club_student_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_student_t_semester_id_semester_d_id_fk\` ON \`club_student_t\``,
    );
    await queryRunner.query(`DROP TABLE \`club_student_t\``);
    await queryRunner.query(`DROP TABLE \`semester_d\``);
    await queryRunner.query(
      `DROP INDEX \`registration_deadline_d_semester_d_id_semester_d_id_fk\` ON \`registration_deadline_d\``,
    );
    await queryRunner.query(`DROP TABLE \`registration_deadline_d\``);
    await queryRunner.query(
      `DROP INDEX \`registration_application_student_student_id_student_id_fk\` ON \`registration_application_student\``,
    );
    await queryRunner.query(
      `DROP INDEX \`registration_application_student_club_id_club_id_fk\` ON \`registration_application_student\``,
    );
    await queryRunner.query(
      `DROP INDEX \`registration_application_student_semester_d_id_semester_d_id_fk\` ON \`registration_application_student\``,
    );
    await queryRunner.query(
      `DROP INDEX \`registration_application_student_status_enum_id_fk\` ON \`registration_application_student\``,
    );
    await queryRunner.query(`DROP TABLE \`registration_application_student\``);
    await queryRunner.query(
      `DROP TABLE \`registration_application_student_status_enum\``,
    );
    await queryRunner.query(
      `DROP INDEX \`professor_sign_status_club_id_fk\` ON \`professor_sign_status\``,
    );
    await queryRunner.query(
      `DROP INDEX \`professor_sign_status_semester_id_fk\` ON \`professor_sign_status\``,
    );
    await queryRunner.query(`DROP TABLE \`professor_sign_status\``);
    await queryRunner.query(
      `DROP INDEX \`club_t_club_id_club_id_fk\` ON \`club_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_t_club_status_enum_id_club_status_enum_id_fk\` ON \`club_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_t_professor_id_professor_id_fk\` ON \`club_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_t_semester_id_semester_d_id_fk\` ON \`club_t\``,
    );
    await queryRunner.query(`DROP TABLE \`club_t\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_492e744e6333071da912c7d651\` ON \`professor\``,
    );
    await queryRunner.query(
      `DROP INDEX \`professor_email_unique\` ON \`professor\``,
    );
    await queryRunner.query(
      `DROP INDEX \`professor_user_id_user_id_fk\` ON \`professor\``,
    );
    await queryRunner.query(`DROP TABLE \`professor\``);
    await queryRunner.query(
      `DROP INDEX \`registration_club_id_club_id_fk\` ON \`registration\``,
    );
    await queryRunner.query(
      `DROP INDEX \`registration_student_id_student_id_fk\` ON \`registration\``,
    );
    await queryRunner.query(
      `DROP INDEX \`registration_division_id_division_id_fk\` ON \`registration\``,
    );
    await queryRunner.query(
      `DROP INDEX \`registration_professor_id_professor_id_fk\` ON \`registration\``,
    );
    await queryRunner.query(
      `DROP INDEX \`registration_semester_d_id_fk\` ON \`registration\``,
    );
    await queryRunner.query(
      `DROP INDEX \`registration_registration_type_enum_id_fk\` ON \`registration\``,
    );
    await queryRunner.query(
      `DROP INDEX \`registration_registration_status_enum_id_fk\` ON \`registration\``,
    );
    await queryRunner.query(
      `DROP INDEX \`registration_activity_plan_file_id_file_id_fk\` ON \`registration\``,
    );
    await queryRunner.query(
      `DROP INDEX \`registration_club_rule_file_id_file_id_fk\` ON \`registration\``,
    );
    await queryRunner.query(
      `DROP INDEX \`registration_external_instruction_file_id_file_id_fk\` ON \`registration\``,
    );
    await queryRunner.query(`DROP TABLE \`registration\``);
    await queryRunner.query(`DROP TABLE \`registration_type_enum\``);
    await queryRunner.query(`DROP TABLE \`registration_status_enum\``);
    await queryRunner.query(
      `DROP INDEX \`registration_executive_comment_registration_id_fk\` ON \`registration_executive_comment\``,
    );
    await queryRunner.query(
      `DROP INDEX \`registration_executive_comment_executive_id_fk\` ON \`registration_executive_comment\``,
    );
    await queryRunner.query(`DROP TABLE \`registration_executive_comment\``);
    await queryRunner.query(
      `DROP INDEX \`file_user_id_user_id_fk\` ON \`file\``,
    );
    await queryRunner.query(`DROP TABLE \`file\``);
    await queryRunner.query(
      `DROP INDEX \`division_district_id_district_id_fk\` ON \`division\``,
    );
    await queryRunner.query(`DROP TABLE \`division\``);
    await queryRunner.query(
      `DROP INDEX \`meeting_attendance_day_which_club_id_club_id_fk\` ON \`meeting_attendance_day\``,
    );
    await queryRunner.query(
      `DROP INDEX \`meeting_attendance_day_which_division_id_division_id_fk\` ON \`meeting_attendance_day\``,
    );
    await queryRunner.query(
      `DROP INDEX \`meeting_meeting_attendance_day_id_fk\` ON \`meeting_attendance_day\``,
    );
    await queryRunner.query(
      `DROP INDEX \`meeting_attendance_day_role_enum_fk\` ON \`meeting_attendance_day\``,
    );
    await queryRunner.query(`DROP TABLE \`meeting_attendance_day\``);
    await queryRunner.query(`DROP TABLE \`meeting_role_enum\``);
    await queryRunner.query(
      `DROP INDEX \`meeting_announcement_id_fk\` ON \`meeting\``,
    );
    await queryRunner.query(`DROP TABLE \`meeting\``);
    await queryRunner.query(
      `DROP INDEX \`meeting_meeting_mapping_id_fk\` ON \`meeting_mapping\``,
    );
    await queryRunner.query(
      `DROP INDEX \`meeting_agenda_meeting_mapping_id_fk\` ON \`meeting_mapping\``,
    );
    await queryRunner.query(
      `DROP INDEX \`meeting_agenda_content_meeting_mapping_id_fk\` ON \`meeting_mapping\``,
    );
    await queryRunner.query(
      `DROP INDEX \`meeting_agenda_vote_meeting_mapping_id_fk\` ON \`meeting_mapping\``,
    );
    await queryRunner.query(`DROP TABLE \`meeting_mapping\``);
    await queryRunner.query(`DROP TABLE \`meeting_agenda_vote\``);
    await queryRunner.query(
      `DROP INDEX \`meeting_agenda_vote_choice_id_fk\` ON \`meeting_vote_choice\``,
    );
    await queryRunner.query(`DROP TABLE \`meeting_vote_choice\``);
    await queryRunner.query(
      `DROP INDEX \`meeting_agenda_vote_result_id_fk\` ON \`meeting_vote_result\``,
    );
    await queryRunner.query(
      `DROP INDEX \`user_meeting_vote_result_id_fk\` ON \`meeting_vote_result\``,
    );
    await queryRunner.query(
      `DROP INDEX \`meeting_vote_choice_result_id_fk\` ON \`meeting_vote_result\``,
    );
    await queryRunner.query(`DROP TABLE \`meeting_vote_result\``);
    await queryRunner.query(`DROP TABLE \`meeting_agenda_content\``);
    await queryRunner.query(`DROP TABLE \`meeting_agenda\``);
    await queryRunner.query(
      `DROP INDEX \`meeting_meeting_attendance_time_t_id_fk\` ON \`meeting_attendance_time_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`user_meeting_attendance_time_t_id_fk\` ON \`meeting_attendance_time_t\``,
    );
    await queryRunner.query(`DROP TABLE \`meeting_attendance_time_t\``);
    await queryRunner.query(`DROP TABLE \`meeting_announcement\``);
    await queryRunner.query(
      `DROP INDEX \`division_president_d_division_id_division_id_fk\` ON \`division_president_d\``,
    );
    await queryRunner.query(
      `DROP INDEX \`division_president_d_student_id_student_id_fk\` ON \`division_president_d\``,
    );
    await queryRunner.query(
      `DROP INDEX \`division_president_d_originated_club_id_club_id_fk\` ON \`division_president_d\``,
    );
    await queryRunner.query(`DROP TABLE \`division_president_d\``);
    await queryRunner.query(`DROP TABLE \`district\``);
    await queryRunner.query(
      `DROP INDEX \`club_division_t_club_id_club_id_fk\` ON \`club_division_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_division_t_division_id_division_id_fk\` ON \`club_division_t\``,
    );
    await queryRunner.query(`DROP TABLE \`club_division_t\``);
    await queryRunner.query(
      `DROP INDEX \`REL_951d8f54dbea209bc083eb2296\` ON \`professor_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_951d8f54dbea209bc083eb2296\` ON \`professor_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`professor_t_professor_id_unique\` ON \`professor_t\``,
    );
    await queryRunner.query(`DROP TABLE \`professor_t\``);
    await queryRunner.query(`DROP TABLE \`club_status_enum\``);
    await queryRunner.query(
      `DROP INDEX \`club_room_t_club_id_club_id_fk\` ON \`club_room_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_room_t_club_building_enum_club_building_enum_id_fk\` ON \`club_room_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_room_t_semester_id_semester_d_id_fk\` ON \`club_room_t\``,
    );
    await queryRunner.query(`DROP TABLE \`club_room_t\``);
    await queryRunner.query(`DROP TABLE \`club_building_enum\``);
    await queryRunner.query(
      `DROP INDEX \`club_delegate_d_club_delegate_enum_id_fk\` ON \`club_delegate_d\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_delegate_d_club_id_club_id_fk\` ON \`club_delegate_d\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_delegate_d_student_id_student_id_fk\` ON \`club_delegate_d\``,
    );
    await queryRunner.query(`DROP TABLE \`club_delegate_d\``);
    await queryRunner.query(
      `DROP INDEX \`club_delegate_change_request_club_id_club_id_fk\` ON \`club_delegate_change_request\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_delegate_change_request_prev_student_id_student_id_fk\` ON \`club_delegate_change_request\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_delegate_change_request_student_id_student_id_fk\` ON \`club_delegate_change_request\``,
    );
    await queryRunner.query(
      `DROP INDEX \`club_delegate_change_request_fk\` ON \`club_delegate_change_request\``,
    );
    await queryRunner.query(`DROP TABLE \`club_delegate_change_request\``);
    await queryRunner.query(
      `DROP TABLE \`club_delegate_change_request_status_enum\``,
    );
    await queryRunner.query(
      `DROP INDEX \`activity_participant_activity_id_fk\` ON \`activity_participant\``,
    );
    await queryRunner.query(
      `DROP INDEX \`activity_participant_student_id_fk\` ON \`activity_participant\``,
    );
    await queryRunner.query(`DROP TABLE \`activity_participant\``);
    await queryRunner.query(
      `DROP INDEX \`employee_user_id_user_id_fk\` ON \`employee\``,
    );
    await queryRunner.query(`DROP TABLE \`employee\``);
    await queryRunner.query(
      `DROP INDEX \`REL_c3df18046e886ec92dc9163114\` ON \`employee_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c3df18046e886ec92dc9163114\` ON \`employee_t\``,
    );
    await queryRunner.query(
      `DROP INDEX \`employee_t_employee_id_unique\` ON \`employee_t\``,
    );
    await queryRunner.query(`DROP TABLE \`employee_t\``);
    await queryRunner.query(
      `DROP INDEX \`expires_at_idx\` ON \`auth_activated_refresh_tokens\``,
    );
    await queryRunner.query(
      `DROP INDEX \`auth_activated_refresh_tokens_user_id_user_id_fk\` ON \`auth_activated_refresh_tokens\``,
    );
    await queryRunner.query(`DROP TABLE \`auth_activated_refresh_tokens\``);
  }
}
