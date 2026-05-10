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
    } catch {
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
      toast.success("구독이 완료되었습니다! 다음주부터 리포트가 발송됩니다.", {
          icon: <CheckCircle className="text-green-500" />,
      });
      setEmail("");
      setVerifyCode("");
    } catch {
      toast.error("인증번호가 올바르지 않습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full rounded-3xl border border-zinc-200 bg-gradient-to-b from-amber-50/70 to-white shadow-sm">
        <CardHeader className="pb-3 text-center">
          <div className="mx-auto mb-2 w-fit rounded-2xl border border-amber-100 bg-white p-3 shadow-sm">
            <Mail className="h-6 w-6 text-amber-500" aria-hidden="true" />
          </div>
          <CardTitle className="text-[20px] font-extrabold tracking-[-0.02em] text-zinc-900">주간 리포트 구독</CardTitle>
          <CardDescription className="text-sm text-zinc-500">
            매주 월요일 아침 9시, 공모주 핵심 요약을 메일로 보내드려요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2.5">
            <label htmlFor="subscription-email" className="sr-only">이메일 주소</label>
            <Input 
              id="subscription-email"
              type="email"
              placeholder="example@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl border-zinc-200 bg-white placeholder:text-zinc-400"
            />
            <Button onClick={handleRequestCode} disabled={isLoading} className="h-11 rounded-xl bg-zinc-900 px-5 font-semibold hover:bg-zinc-800">
              {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : "구독"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-11/12 rounded-2xl border-zinc-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>이메일 인증</DialogTitle>
            <DialogDescription>
              {email}으로 전송된 6자리 인증번호를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
             <div className="grid flex-1 gap-2">
                <label htmlFor="verification-code" className="sr-only">인증번호 6자리</label>
                <Input 
                  id="verification-code"
                  placeholder="123456" 
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="h-11 rounded-xl border-zinc-200 text-center text-lg font-semibold tracking-[0.35em]"
                  maxLength={6}
                  inputMode="numeric"
                />
             </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2">
             <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>취소</Button>
              <Button onClick={handleVerify} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : "확인"}
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
