<?php

namespace Tests\Unit;

use App\Helpers\LevelHelper;
use App\Models\Student;
use App\Models\User;
use Tests\TestCase;

class FullAccessUserTest extends TestCase
{
    public function test_listed_username_or_email_gets_full_access(): void
    {
        config(['licensing.full_access_users' => ['demo01', 'qa@hometutor.com.my']]);

        $this->assertTrue((new User(['username' => 'Demo01']))->hasFullAccess());
        $this->assertTrue((new User(['email' => 'QA@hometutor.com.my']))->hasFullAccess());
        $this->assertFalse((new User(['username' => 'student02']))->hasFullAccess());
    }

    public function test_full_access_user_can_switch_to_every_form(): void
    {
        config(['licensing.full_access_users' => ['demo01']]);

        $user = new User(['username' => 'demo01']);
        $user->setRelation('student', new Student(['level_id' => 7]));

        $forms = LevelHelper::getAvailableFormsForUser($user);

        $this->assertCount(11, $forms);
        $this->assertSame('Standard 1', $forms[0]);
        $this->assertSame('Form 5', $forms[10]);
    }

    public function test_normal_student_stays_in_own_category(): void
    {
        config(['licensing.full_access_users' => ['demo01']]);

        $user = new User(['username' => 'student02']);
        $user->setRelation('student', new Student(['level_id' => 7]));

        $this->assertSame(['Form 1', 'Form 2', 'Form 3'], LevelHelper::getAvailableFormsForUser($user));
    }
}
