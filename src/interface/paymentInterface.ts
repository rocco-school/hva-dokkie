interface paymentInterface {
    readonly paymentId: number,
    datePaid: Date,
    description: string,
    customAmount: number,
    paymentAmount: number,
    eventId: string | any,
    expenseId: string | any,
    participantId: number,
    paymentStatus: number
}