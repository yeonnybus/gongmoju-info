"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { requestVerificationCode, verifySubscriber } from "@/lib/api";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import { useState } from 'react';
import { toast } from "sonner";

export function EmailSubscription() {
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 1. Request Verification Code
  const handleRequestCode = async () => {
    if (!email || !email.includes('@')) {
      toast.error("유효한 이메일 주소를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await requestVerificationCode(email);
      setIsDialogOpen(true);
      toast.success("인증번호가 발송되었습니다! 메일함을 확인해주세요.");
    } catch (error) {
      toast.error("인증번호 발송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify Code
  const handleVerify = async () => {
    if (verifyCode.length < 6) {
      toast.error("6자리 인증번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await verifySubscriber(email, verifyCode);
      setIsDialogOpen(false);
      toast.success("구독이 완료되었습니다! 내일부터 리포트가 발송됩니다.", {
          icon: <CheckCircle className="text-green-500" />,
      });
      setEmail("");
      setVerifyCode("");
    } catch (error) {
      toast.error("인증번호가 올바르지 않습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full border-dashed border-2 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3 text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg">주간 리포트 구독</CardTitle>
          <CardDescription>
            매주 월요일 아침 9시, 공모주 핵심 요약을 메일로 보내드려요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              placeholder="example@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background"
            />
            <Button onClick={handleRequestCode} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "구독"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md w-11/12 rounded-lg">
          <DialogHeader>
            <DialogTitle>이메일 인증</DialogTitle>
            <DialogDescription>
              {email}으로 전송된 6자리 인증번호를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
             <div className="grid flex-1 gap-2">
                <Input 
                  placeholder="123456" 
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
             </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2">
             <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>취소</Button>
             <Button onClick={handleVerify} disabled={isLoading}>
               {isLoading ? <Loader2 className="animate-spin" /> : "확인"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
