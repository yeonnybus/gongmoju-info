
export interface IpoData {
    competition?: string | null;
    lockupRate?: string | null;
    circulatingSupply?: string | null;
    offerPrice?: number | null;
    otcPrice?: string | null;
    listDate?: string | null;
}

export interface ScoreResult {
    totalScore: number;
    grade: string;
    description: string;
    colorClass: string; // Tailwind text color class
    bgClass: string; // Tailwind bg color class for badge/card
    details: {
        competitionScore: number;
        lockupScore: number;
        supplyScore: number;
        otcScore: number;
        listingScore: number;
    }
}

export function calculateIpoScore(ipo: IpoData): ScoreResult {
    let competitionScore = 0;
    let lockupScore = 0;
    let supplyScore = 0;
    let otcScore = 0;
    let listingScore = 0; // 동시상장 여부 (데이터 없음)

    // 1. 기관경쟁률 (Institution Competition Rate)
    // ~300: 0, 300~350: 1, 350~400: 2, 400~450: 3, 450~500: 4, 500~: 5
    if (ipo.competition) {
        const match = ipo.competition.match(/([\d,.]+)/);
        if (match) {
            const rate = parseFloat(match[1].replace(/,/g, ''));
            if (rate >= 500) competitionScore = 5;
            else if (rate >= 450) competitionScore = 4;
            else if (rate >= 400) competitionScore = 3;
            else if (rate >= 350) competitionScore = 2;
            else if (rate >= 300) competitionScore = 1;
            else competitionScore = 0;
        }
    }

    // 2. 의무보유확약 (Mandatory Holding Commitment)
    // ~5%: 0, 5~10%: 2, 10~15%: 4, 15~20%: 6, 20~30%: 8, 30%~: 10
    if (ipo.lockupRate) {
        const match = ipo.lockupRate.match(/([\d,.]+)/);
        if (match) {
            const rate = parseFloat(match[1].replace(/,/g, ''));
            if (rate >= 30) lockupScore = 10;
            else if (rate >= 20) lockupScore = 8;
            else if (rate >= 15) lockupScore = 6;
            else if (rate >= 10) lockupScore = 4;
            else if (rate >= 5) lockupScore = 2;
            else lockupScore = 0;
        }
    }

    // 3. 유통가능물량 (Circulating Supply Value in 100M KRW)
    // 3000억~: 0, ~3000억: 1, ~2000억: 2, ~1000억: 4, ~500억: 6, ~200억: 10
    // Note: Ranges interpreted as upper bounds for higher scores.
    // > 3000: 0
    // 2000 < x <= 3000: 1
    // 1000 < x <= 2000: 2
    // 500 < x <= 1000: 4
    // 200 < x <= 500: 6
    // <= 200: 10
    if (ipo.circulatingSupply) {
        const match = ipo.circulatingSupply.match(/(\d+)억/);
        if (match) {
            const value = parseInt(match[1], 10);
            if (value <= 200) supplyScore = 10;
            else if (value <= 500) supplyScore = 6;
            else if (value <= 1000) supplyScore = 4;
            else if (value <= 2000) supplyScore = 2;
            else if (value <= 3000) supplyScore = 1;
            else supplyScore = 0;
        }
    }

    // 4. 장외가격 (OTC Price) vs Offer Price
    // <= +50%: -3
    // +50 ~ 100%: 0
    // +100 ~ 160%: 3
    // +160% ~: 6
    if (ipo.otcPrice && ipo.offerPrice) {
        const otc = parseInt(ipo.otcPrice.toString().replace(/,/g, ''), 10);
        const offer = ipo.offerPrice;
        
        if (!isNaN(otc) && !isNaN(offer) && offer > 0) {
            const ratio = ((otc - offer) / offer) * 100;
            
            if (ratio >= 160) otcScore = 6;
            else if (ratio >= 100) otcScore = 3;
            else if (ratio > 50) otcScore = 0;
            else otcScore = -3;
        }
    }

    const totalScore = competitionScore + lockupScore + supplyScore + otcScore + listingScore;

    // Result Determination
    // 0 ~ 5: 손실 위험 (Red)
    // 6 ~ 10: 손실 가능 (Orange)
    // 11 ~ 15: 50% (Light Green / Lime)
    // 16 ~ 20: 100% (Green)
    // 21 ~: 160% (Blue)

    let grade = '';
    let description = '';
    let colorClass = '';
    let bgClass = '';

    if (totalScore >= 21) {
        grade = '따따블 가능성 높음'; // 160% implies high return
        description = '예상 수익률 160% 이상';
        colorClass = 'text-blue-600';
        bgClass = 'bg-blue-100 dark:bg-blue-900/30';
    } else if (totalScore >= 16) {
        grade = '따블 가능성 높음'; // 100%
        description = '예상 수익률 100% 안팎';
        colorClass = 'text-emerald-600';
        bgClass = 'bg-emerald-100 dark:bg-emerald-900/30';
    } else if (totalScore >= 11) {
        grade = '무난한 수익'; // 50%
        description = '예상 수익률 50% 안팎';
        colorClass = 'text-lime-600';
        bgClass = 'bg-lime-100 dark:bg-lime-900/30';
    } else if (totalScore >= 6) {
        grade = '손실 주의';
        description = '손실 가능성 있음';
        colorClass = 'text-orange-500';
        bgClass = 'bg-orange-100 dark:bg-orange-900/30';
    } else {
        grade = '청약 주의';
        description = '손실 위험 높음';
        colorClass = 'text-red-500';
        bgClass = 'bg-red-100 dark:bg-red-900/30';
    }

    return {
        totalScore,
        grade,
        description,
        colorClass,
        bgClass,
        details: {
            competitionScore,
            lockupScore,
            supplyScore,
            otcScore,
            listingScore
        }
    };
}
