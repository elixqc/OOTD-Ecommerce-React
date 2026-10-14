import { UserProfile } from '@clerk/react';

export default function UpdatePassword() {
    return (
        <div className="auth-wrapper">
            <UserProfile routing="path" path="/password/update" />
        </div>
    );
}