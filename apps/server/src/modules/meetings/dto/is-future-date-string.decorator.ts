import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: "isFutureDateString", async: false })
class IsFutureDateStringConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== "string") {
      return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const today = new Date().toISOString().slice(0, 10);

    return value > today;
  }

  defaultMessage(_: ValidationArguments): string {
    return "announcementDate must be a future date";
  }
}

export function IsFutureDateString(validationOptions?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      constraints: [],
      validator: IsFutureDateStringConstraint,
    });
  };
}
